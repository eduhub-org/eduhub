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

    def test_falls_back_when_no_instances_match_window(self):
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
