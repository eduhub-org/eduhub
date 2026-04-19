"""Unit tests for the rewritten ZoomClient.

These tests deliberately avoid the ``__init__`` path (which hits the Zoom
OAuth endpoint) by constructing instances via ``object.__new__`` and
injecting the attributes that real callers would get from ``__init__``.
"""
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from api_clients.zoom_client import ZoomClient


def _make_client():
    client = ZoomClient.__new__(ZoomClient)
    client.api_key = "k"
    client.api_secret = "s"
    client.account_id = "a"
    client.base_url = "https://api.zoom.us/v2"
    client.reports_url = f"{client.base_url}/report/meetings"
    client.past_meetings_url = f"{client.base_url}/past_meetings"
    client.access_token = "token"
    # Far future so validate_token() never triggers a refresh during tests.
    client.token_expiration = 10_000_000_000
    client._timeout = (1, 5)
    return client


# ----------------------------------------------------------------------
# URL + id parsing
# ----------------------------------------------------------------------


class TestMeetingIdParsing:
    def test_extracts_id_from_full_url(self):
        client = _make_client()
        assert client.get_meeting_id("https://zoom.us/j/123456789") == "123456789"

    def test_strips_password_query(self):
        client = _make_client()
        url = "https://us06web.zoom.us/j/987654321?pwd=abc"
        assert client.get_meeting_id(url) == "987654321"

    def test_accepts_bare_id(self):
        client = _make_client()
        assert client.get_meeting_id("555555") == "555555"


class TestUuidEncoding:
    def test_plain_uuid_is_urlencoded_once(self):
        # Zoom: single-encode simple UUIDs.
        assert ZoomClient._encode_meeting_uuid("abcDEF123") == "abcDEF123"

    def test_uuid_starting_with_slash_is_double_encoded(self):
        encoded = ZoomClient._encode_meeting_uuid("/abc==")
        # '/' -> '%2F' -> '%252F', '=' -> '%3D' -> '%253D'
        assert encoded.startswith("%252F")
        assert "%253D" in encoded

    def test_uuid_containing_double_slash_is_double_encoded(self):
        encoded = ZoomClient._encode_meeting_uuid("a//b")
        assert encoded == "a%252F%252Fb"


# ----------------------------------------------------------------------
# Instance filtering
# ----------------------------------------------------------------------


class TestInstanceFiltering:
    def _instances(self):
        return [
            {"uuid": "early", "start_time": "2026-01-01T08:00:00Z"},
            {"uuid": "on_time", "start_time": "2026-01-01T09:55:00Z"},
            {"uuid": "during", "start_time": "2026-01-01T10:30:00Z"},
            # Within the +2h post buffer — captures reconnects after class.
            {"uuid": "just_after", "start_time": "2026-01-01T11:45:00Z"},
            # Outside the post buffer.
            {"uuid": "way_after", "start_time": "2026-01-01T15:00:00Z"},
        ]

    def test_only_window_instances_are_kept(self):
        client = _make_client()
        session_start = "2026-01-01T10:00:00Z"
        session_end = "2026-01-01T11:30:00Z"

        kept = client.filter_instances_by_session_window(
            self._instances(),
            session_start,
            session_end,
            pre_buffer=pd.Timedelta(minutes=30),
            post_buffer=pd.Timedelta(hours=2),
        )

        uuids = [i["uuid"] for i in kept]
        assert uuids == ["on_time", "during", "just_after"]

    def test_results_are_sorted_by_start_time(self):
        client = _make_client()
        instances = [
            {"uuid": "late_mid", "start_time": "2026-01-01T10:30:00Z"},
            {"uuid": "early_mid", "start_time": "2026-01-01T10:10:00Z"},
        ]
        kept = client.filter_instances_by_session_window(
            instances,
            "2026-01-01T10:00:00Z",
            "2026-01-01T11:00:00Z",
            pre_buffer=pd.Timedelta(minutes=0),
            post_buffer=pd.Timedelta(minutes=0),
        )
        assert [i["uuid"] for i in kept] == ["early_mid", "late_mid"]

    def test_raises_on_missing_session_window(self):
        client = _make_client()
        with pytest.raises(ValueError):
            client.filter_instances_by_session_window(
                self._instances(), None, None
            )


# ----------------------------------------------------------------------
# Aggregation
# ----------------------------------------------------------------------


class TestAggregation:
    def test_merges_duplicate_participants_by_email(self):
        client = _make_client()
        rows = [
            # First instance: the real class.
            {
                "name": "Jane Doe",
                "user_email": "jane@example.com",
                "join_time": "2026-01-01T10:00:00Z",
                "leave_time": "2026-01-01T10:40:00Z",
                "_meeting_uuid": "inst1",
                "_instance_start": "2026-01-01T10:00:00Z",
            },
            # Second instance: reconnect after a drop, same email.
            {
                "name": "Jane D.",
                "user_email": "JANE@example.com",
                "join_time": "2026-01-01T10:50:00Z",
                "leave_time": "2026-01-01T11:20:00Z",
                "_meeting_uuid": "inst2",
                "_instance_start": "2026-01-01T10:50:00Z",
            },
            # Unrelated participant.
            {
                "name": "Bob Smith",
                "user_email": "bob@example.com",
                "join_time": "2026-01-01T10:05:00Z",
                "leave_time": "2026-01-01T11:00:00Z",
                "_meeting_uuid": "inst1",
                "_instance_start": "2026-01-01T10:00:00Z",
            },
        ]

        df = client.aggregate_participants(rows)
        assert len(df) == 2

        jane = df[df["email"] == "jane@example.com"].iloc[0]
        assert jane["joinDateTime"] == pd.Timestamp("2026-01-01T10:00:00Z")
        assert jane["leaveDateTime"] == pd.Timestamp("2026-01-01T11:20:00Z")
        # Two disjoint intervals → 1 interruption.
        assert jane["interruptionCount"] == 1
        # 40 min + 30 min = 70 min = 4200 s.
        assert jane["duration"] == 4200
        assert set(jane["meetingUuids"]) == {"inst1", "inst2"}

        bob = df[df["email"] == "bob@example.com"].iloc[0]
        assert bob["interruptionCount"] == 0
        assert bob["duration"] == 55 * 60

    def test_overlapping_intervals_are_merged_not_double_counted(self):
        client = _make_client()
        rows = [
            {
                "name": "A",
                "user_email": "a@example.com",
                "join_time": "2026-01-01T10:00:00Z",
                "leave_time": "2026-01-01T10:30:00Z",
            },
            {
                "name": "A",
                "user_email": "a@example.com",
                "join_time": "2026-01-01T10:20:00Z",
                "leave_time": "2026-01-01T10:40:00Z",
            },
        ]
        df = client.aggregate_participants(rows)
        assert len(df) == 1
        # 10:00-10:40 merged = 40 min.
        assert df.iloc[0]["duration"] == 40 * 60
        assert df.iloc[0]["interruptionCount"] == 0

    def test_falls_back_to_name_when_email_missing(self):
        client = _make_client()
        rows = [
            {
                "name": "Anonymous",
                "join_time": "2026-01-01T10:00:00Z",
                "leave_time": "2026-01-01T10:15:00Z",
            },
            {
                "name": "Anonymous",
                "join_time": "2026-01-01T10:30:00Z",
                "leave_time": "2026-01-01T11:00:00Z",
            },
        ]
        df = client.aggregate_participants(rows)
        assert len(df) == 1
        assert df.iloc[0]["interruptionCount"] == 1

    def test_empty_input_returns_empty_frame(self):
        client = _make_client()
        df = client.aggregate_participants([])
        assert len(df) == 0


# ----------------------------------------------------------------------
# Pagination
# ----------------------------------------------------------------------


class TestHttpTimeouts:
    """Every outbound Zoom HTTP call must pass a timeout so the daily
    attendance cron cannot hang on a stalled socket. A regression here
    would silently stall the entire job; these tests lock the contract
    in place for current and future endpoints.
    """

    def _timeout_from_call(self, call):
        if "timeout" in call.kwargs:
            return call.kwargs["timeout"]
        # requests.get/post signature: (url, params=..., data=..., headers=...,
        # timeout=...) — timeout is always a keyword in this module.
        return None

    def test_get_wrapper_passes_instance_timeout(self):
        client = _make_client()
        client._timeout = (3, 7)
        resp = MagicMock(status_code=200, json=lambda: {"meetings": []})
        with patch(
            "api_clients.zoom_client.requests.get", return_value=resp
        ) as mock_get:
            client._get("https://example/url", params={"x": 1})
        assert mock_get.call_count == 1
        assert self._timeout_from_call(mock_get.call_args) == (3, 7)

    def test_legacy_get_last_meeting_session_passes_timeout(self):
        client = _make_client()
        client._timeout = (3, 7)
        resp = MagicMock(status_code=200, json=lambda: {})
        with patch(
            "api_clients.zoom_client.requests.get", return_value=resp
        ) as mock_get:
            client.get_last_meeting_session("123456")
        assert self._timeout_from_call(mock_get.call_args) == (3, 7)

    def test_zoom_get_meeting_report_passes_timeout(self):
        client = _make_client()
        client._timeout = (3, 7)
        resp = MagicMock(status_code=200, json=lambda: {})
        with patch(
            "api_clients.zoom_client.requests.get", return_value=resp
        ) as mock_get:
            client.zoom_get_meeting_report("123456")
        assert self._timeout_from_call(mock_get.call_args) == (3, 7)

    def test_fetch_access_token_passes_timeout(self):
        from api_clients.zoom_client import ZoomClient as ZC

        client = ZC.__new__(ZC)
        client.api_key = "k"
        client.api_secret = "s"
        client.account_id = "a"
        client._timeout = (3, 7)

        token_resp = MagicMock(status_code=200)
        token_resp.text = '{"access_token": "abc", "expires_in": 3600}'
        with patch(
            "api_clients.zoom_client.requests.post", return_value=token_resp
        ) as mock_post:
            client.fetch_access_token()
        assert mock_post.call_count == 1
        assert self._timeout_from_call(mock_post.call_args) == (3, 7)

    def test_fetch_access_token_uses_default_when_instance_timeout_unset(self):
        """``fetch_access_token`` is invoked from ``__init__`` before
        ``_timeout`` is assigned; it must still pass a timeout."""
        from api_clients.zoom_client import DEFAULT_TIMEOUT, ZoomClient as ZC

        client = ZC.__new__(ZC)
        client.api_key = "k"
        client.api_secret = "s"
        client.account_id = "a"
        # Intentionally no _timeout attribute.

        token_resp = MagicMock(status_code=200)
        token_resp.text = '{"access_token": "abc", "expires_in": 3600}'
        with patch(
            "api_clients.zoom_client.requests.post", return_value=token_resp
        ) as mock_post:
            client.fetch_access_token()
        assert self._timeout_from_call(mock_post.call_args) == DEFAULT_TIMEOUT

    def test_env_override_applies_to_resolved_default(self, monkeypatch):
        from api_clients.zoom_client import _resolve_default_timeout

        monkeypatch.setenv("ZOOM_HTTP_TIMEOUT_SEC", "12.5")
        assert _resolve_default_timeout() == (12.5, 12.5)

    def test_env_override_falls_back_on_invalid_value(self, monkeypatch):
        from api_clients.zoom_client import DEFAULT_TIMEOUT, _resolve_default_timeout

        monkeypatch.setenv("ZOOM_HTTP_TIMEOUT_SEC", "not-a-number")
        assert _resolve_default_timeout() == DEFAULT_TIMEOUT


class TestTokenCaching:
    """fetch_access_token must return an absolute expiry epoch (not the
    relative TTL) so validate_token can cache the token and avoid a fresh
    OAuth round-trip on every request. A regression here would re-enable
    the original bug where Zoom returned expires_in=3600 and the cache
    check (time.time() > 3600-10) always fired.
    """

    def _patch_token_response(self, expires_in=3600):
        token_resp = MagicMock(status_code=200)
        token_resp.text = (
            '{"access_token": "abc123", "expires_in": ' + str(expires_in) + "}"
        )
        return patch(
            "api_clients.zoom_client.requests.post", return_value=token_resp
        )

    def test_fetch_access_token_returns_absolute_epoch(self):
        from api_clients.zoom_client import ZoomClient as ZC

        client = ZC.__new__(ZC)
        client.api_key = "k"
        client.api_secret = "s"
        client.account_id = "a"
        client._timeout = (1, 5)

        before = __import__("time").time()
        with self._patch_token_response(expires_in=3600):
            token, expiration = client.fetch_access_token()
        after = __import__("time").time()

        assert token == "abc123"
        # Expiration is an absolute epoch ~ now + 3600, not 3600.
        assert before + 3600 - 1 <= expiration <= after + 3600 + 1
        assert client.token_expiration == expiration

    def test_validate_token_caches_across_calls(self):
        """Given a freshly-issued token with plenty of life left,
        validate_token must be a no-op and NOT hit the network again."""
        from api_clients.zoom_client import ZoomClient as ZC
        import time as _time

        client = ZC.__new__(ZC)
        client.api_key = "k"
        client.api_secret = "s"
        client.account_id = "a"
        client._timeout = (1, 5)

        with self._patch_token_response(expires_in=3600) as mock_post:
            # First call triggers a fetch.
            client.access_token = None
            client.token_expiration = None
            client.validate_token()
            assert mock_post.call_count == 1
            first_token = client.access_token

            # Second call immediately after must not refresh.
            client.validate_token()
            assert mock_post.call_count == 1
            assert client.access_token == first_token
            # Token expiration is a future epoch, well past the 10s buffer.
            assert client.token_expiration > _time.time() + 60

    def test_validate_token_refreshes_when_expired(self):
        from api_clients.zoom_client import ZoomClient as ZC
        import time as _time

        client = ZC.__new__(ZC)
        client.api_key = "k"
        client.api_secret = "s"
        client.account_id = "a"
        client._timeout = (1, 5)
        client.access_token = "old"
        # Already past expiration.
        client.token_expiration = _time.time() - 5

        with self._patch_token_response(expires_in=3600) as mock_post:
            client.validate_token()

        assert mock_post.call_count == 1
        assert client.access_token == "abc123"


class TestPagination:
    def test_fetch_participants_follows_next_page_token(self):
        client = _make_client()

        first = MagicMock()
        first.status_code = 200
        first.json.return_value = {
            "participants": [{"name": "A"}],
            "next_page_token": "page2",
        }
        second = MagicMock()
        second.status_code = 200
        second.json.return_value = {
            "participants": [{"name": "B"}],
            "next_page_token": "",
        }

        with patch(
            "api_clients.zoom_client.requests.get",
            side_effect=[first, second],
        ) as mock_get:
            participants = client._fetch_participants("https://example/url")

        assert [p["name"] for p in participants] == ["A", "B"]
        assert mock_get.call_count == 2
        second_call_params = mock_get.call_args_list[1].kwargs["params"]
        assert second_call_params["next_page_token"] == "page2"


# ----------------------------------------------------------------------
# End-to-end orchestration: get_session_attendance
# ----------------------------------------------------------------------


class TestGetSessionAttendance:
    def test_pulls_participants_per_relevant_instance(self):
        client = _make_client()

        instances = [
            {"uuid": "inst_in_window", "start_time": "2026-01-01T10:05:00Z"},
            {"uuid": "inst_way_after", "start_time": "2026-01-01T15:00:00Z"},
        ]

        participants_in_window = [
            {
                "name": "Jane",
                "user_email": "jane@example.com",
                "join_time": "2026-01-01T10:05:00Z",
                "leave_time": "2026-01-01T11:00:00Z",
            }
        ]

        with patch.object(
            client, "list_past_meeting_instances", return_value=instances
        ), patch.object(
            client, "get_meeting_instance_participants"
        ) as mock_get_parts, patch.object(
            client, "get_meeting_participants_by_id"
        ) as mock_fallback:
            mock_get_parts.return_value = participants_in_window
            df = client.get_session_attendance(
                "https://zoom.us/j/42?pwd=x",
                session_start="2026-01-01T10:00:00Z",
                session_end="2026-01-01T11:00:00Z",
            )

        # Only the in-window instance should have been fetched.
        mock_get_parts.assert_called_once_with("inst_in_window")
        mock_fallback.assert_not_called()
        assert len(df) == 1
        assert df.iloc[0]["email"] == "jane@example.com"

    def test_falls_back_to_report_by_id_when_no_past_instances(self):
        """With zero past instances Zoom has no richer data available;
        the legacy endpoint is the best signal we have."""
        client = _make_client()

        participants = [
            {
                "name": "Legacy",
                "user_email": "legacy@example.com",
                "join_time": "2026-01-01T10:05:00Z",
                "leave_time": "2026-01-01T10:45:00Z",
            }
        ]

        with patch.object(
            client, "list_past_meeting_instances", return_value=[]
        ), patch.object(
            client, "get_meeting_participants_by_id", return_value=participants
        ) as mock_fallback:
            df = client.get_session_attendance(
                "https://zoom.us/j/77",
                session_start="2026-01-01T10:00:00Z",
                session_end="2026-01-01T11:00:00Z",
            )

        mock_fallback.assert_called_once()
        assert len(df) == 1
        assert df.iloc[0]["email"] == "legacy@example.com"

    def test_does_not_fall_back_when_instances_exist_but_none_in_window(self):
        """Regression guard: if Zoom has tracked instances for the
        meeting but none overlap the session window, we must NOT pull
        the "last call" (which was the original bug) — return empty
        aggregation instead."""
        client = _make_client()

        instances = [
            {"uuid": "way_after", "start_time": "2026-01-02T15:00:00Z"},
        ]

        with patch.object(
            client, "list_past_meeting_instances", return_value=instances
        ), patch.object(
            client, "get_meeting_participants_by_id"
        ) as mock_fallback, patch.object(
            client, "get_meeting_instance_participants"
        ) as mock_parts:
            df = client.get_session_attendance(
                "https://zoom.us/j/77",
                session_start="2026-01-01T10:00:00Z",
                session_end="2026-01-01T11:00:00Z",
            )

        mock_fallback.assert_not_called()
        mock_parts.assert_not_called()
        assert len(df) == 0

    def test_list_past_meeting_instances_error_propagates(self):
        """list_past_meeting_instances failures must not be swallowed —
        check_attendance relies on them to skip the session for retry."""
        client = _make_client()

        with patch.object(
            client,
            "list_past_meeting_instances",
            side_effect=RuntimeError("Zoom 503"),
        ), patch.object(
            client, "get_meeting_participants_by_id"
        ) as mock_fallback:
            with pytest.raises(RuntimeError, match="Zoom 503"):
                client.get_session_attendance(
                    "https://zoom.us/j/77",
                    session_start="2026-01-01T10:00:00Z",
                    session_end="2026-01-01T11:00:00Z",
                )
        mock_fallback.assert_not_called()

    def test_per_instance_failure_raises_zoom_attendance_error(self):
        """When one of several instance fetches fails, aggregation must
        stop with ZoomAttendanceError carrying meeting_id + failed uuids."""
        from api_clients.zoom_client import ZoomAttendanceError

        client = _make_client()

        instances = [
            {"uuid": "inst_ok", "start_time": "2026-01-01T10:05:00Z"},
            {"uuid": "inst_bad", "start_time": "2026-01-01T10:45:00Z"},
        ]

        def _side_effect(uuid):
            if uuid == "inst_bad":
                raise RuntimeError("Zoom 500 on this instance")
            return [
                {
                    "name": "Jane",
                    "user_email": "jane@example.com",
                    "join_time": "2026-01-01T10:05:00Z",
                    "leave_time": "2026-01-01T10:40:00Z",
                }
            ]

        with patch.object(
            client, "list_past_meeting_instances", return_value=instances
        ), patch.object(
            client, "get_meeting_instance_participants", side_effect=_side_effect
        ):
            with pytest.raises(ZoomAttendanceError) as err:
                client.get_session_attendance(
                    "https://zoom.us/j/77",
                    session_start="2026-01-01T10:00:00Z",
                    session_end="2026-01-01T11:00:00Z",
                )

        assert err.value.meeting_id == "77"
        assert err.value.failed_uuids == ["inst_bad"]
