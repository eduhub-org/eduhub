"""Unit tests for the Mailgun delivery-status sync.

The incident this function exists for is a mass send through a stale recipient
list, so the cases that matter are: a permanent failure is recorded, a temporary
one is not, a row is never walked backwards, and the bounce-rate check fires
loudly enough to stop the next batch.
"""

from datetime import datetime, timedelta, timezone

import pytest

from api_clients.mailgun_client import (
    EVENT_FILTER,
    MailgunClient,
    PAGE_LIMIT,
    configured_domains,
    maillog_id,
)
from pythonFunctions.sync_mail_delivery_status import (
    BOUNCE_RATE_MIN_SAMPLE,
    BOUNCE_RATE_THRESHOLD,
    MAX_LOOKBACK_HOURS,
    STATUS_BOUNCED,
    STATUS_COMPLAINED,
    STATUS_DELIVERED,
    apply_statuses,
    bounce_rate,
    check_bounce_threshold,
    classify_event,
    collect_statuses,
    resolve_begin,
)


class FakeEduHubClient:
    """Records mutations and replays canned responses."""

    def __init__(self, responses=None, affected=1):
        self.calls = []
        self.responses = list(responses or [])
        self.affected = affected

    def send_query(self, query, variables):
        self.calls.append({"query": query, "variables": variables})
        if self.responses:
            return self.responses.pop(0)
        if "update_MailLog" in query:
            ids = variables["where"]["id"]["_in"]
            return {"data": {"update_MailLog": {"affected_rows": len(ids)}}}
        return {"data": {"MailLog": []}}


class FakeMailgunClient:
    """Yields canned events per domain; raises for domains in `failing`."""

    def __init__(self, events_by_domain, failing=()):
        self.domains = list(events_by_domain)
        self.events_by_domain = events_by_domain
        self.failing = set(failing)
        self.begins = []

    def iter_events(self, domain, begin_timestamp):
        self.begins.append((domain, begin_timestamp))
        if domain in self.failing:
            raise RuntimeError("401 Unauthorized")
        return iter(self.events_by_domain[domain])


def event(name, maillog=None, severity=None):
    payload = {"event": name}
    if severity is not None:
        payload["severity"] = severity
    if maillog is not None:
        payload["user-variables"] = {"maillogId": str(maillog)}
    return payload


class TestClassifyEvent:
    def test_delivered_and_complained_map_straight_through(self):
        assert classify_event(event("delivered")) == STATUS_DELIVERED
        assert classify_event(event("complained")) == STATUS_COMPLAINED

    def test_permanent_failure_is_a_bounce(self):
        assert classify_event(event("failed", severity="permanent")) == STATUS_BOUNCED

    def test_temporary_failure_is_left_alone(self):
        # The bug worth guarding: Mailgun is still retrying, and a later
        # delivered event for the same message is expected. Writing BOUNCED
        # here would condemn mail that is about to arrive.
        assert classify_event(event("failed", severity="temporary")) is None

    def test_unknown_severity_is_not_treated_as_a_bounce(self):
        assert classify_event(event("failed", severity="deferred?")) is None
        assert classify_event(event("failed")) is None

    def test_events_we_do_not_track_are_ignored(self):
        for name in ("accepted", "opened", "clicked", "unsubscribed", ""):
            assert classify_event({"event": name}) is None

    def test_case_is_not_significant(self):
        assert classify_event({"event": "DELIVERED"}) == STATUS_DELIVERED
        assert classify_event({"event": "Failed", "severity": "Permanent"}) == STATUS_BOUNCED


class TestMaillogId:
    def test_reads_the_custom_variable_as_an_int(self):
        assert maillog_id(event("delivered", maillog=4711)) == 4711

    def test_missing_variable_is_none(self):
        assert maillog_id({"event": "delivered"}) is None
        assert maillog_id({"event": "delivered", "user-variables": {}}) is None

    def test_unusable_variable_is_none_rather_than_an_exception(self):
        # Mail sent before v:maillogId existed, or a hand-crafted send.
        assert maillog_id({"user-variables": {"maillogId": "not-a-number"}}) is None
        assert maillog_id({"user-variables": {"maillogId": None}}) is None


class TestConfiguredDomains:
    def test_reads_the_default_plus_the_additional_domains(self, monkeypatch):
        monkeypatch.setenv("MAILGUN_DOMAIN", "edu.opencampus.sh")
        monkeypatch.setenv("MAILGUN_ADDITIONAL_DOMAINS", "stujo.net, Example.ORG ")

        assert configured_domains() == ["edu.opencampus.sh", "stujo.net", "example.org"]

    def test_deduplicates_and_drops_blanks(self, monkeypatch):
        monkeypatch.setenv("MAILGUN_DOMAIN", "stujo.net")
        monkeypatch.setenv("MAILGUN_ADDITIONAL_DOMAINS", "stujo.net,,")

        assert configured_domains() == ["stujo.net"]

    def test_client_refuses_to_run_without_a_domain(self, monkeypatch):
        monkeypatch.delenv("MAILGUN_DOMAIN", raising=False)
        monkeypatch.delenv("MAILGUN_ADDITIONAL_DOMAINS", raising=False)

        with pytest.raises(ValueError, match="sending domain"):
            MailgunClient(api_key="key")

    def test_client_refuses_to_run_without_a_key(self, monkeypatch):
        monkeypatch.delenv("MAILGUN_API_KEY", raising=False)

        with pytest.raises(ValueError, match="MAILGUN_API_KEY"):
            MailgunClient(domains=["stujo.net"])


class TestIterEvents:
    """The paging walk, with requests.get stubbed out."""

    def _client(self, monkeypatch, pages):
        client = MailgunClient(api_key="key", domains=["stujo.net"])
        calls = []

        class FakeResponse:
            def __init__(self, payload):
                self._payload = payload

            def raise_for_status(self):
                return None

            def json(self):
                return self._payload

        def fake_get(url, auth=None, params=None, timeout=None):
            calls.append({"url": url, "params": params, "auth": auth})
            return FakeResponse(pages[len(calls) - 1])

        monkeypatch.setattr("api_clients.mailgun_client.requests.get", fake_get)
        return client, calls

    def test_follows_paging_next_until_a_page_is_empty(self, monkeypatch):
        pages = [
            {"items": [event("delivered", 1)], "paging": {"next": "https://next/1"}},
            {"items": [event("delivered", 2)], "paging": {"next": "https://next/2"}},
            {"items": [], "paging": {"next": "https://next/3"}},
        ]
        client, calls = self._client(monkeypatch, pages)

        events = list(client.iter_events("stujo.net", 1_700_000_000))

        assert [maillog_id(e) for e in events] == [1, 2]
        # Stopped at the empty page, did not follow its `next`.
        assert [call["url"] for call in calls] == [
            "https://api.eu.mailgun.net/v3/stujo.net/events",
            "https://next/1",
            "https://next/2",
        ]

    def test_first_request_carries_the_filter_and_window(self, monkeypatch):
        client, calls = self._client(monkeypatch, [{"items": []}])

        list(client.iter_events("stujo.net", 1_700_000_000))

        assert calls[0]["params"] == {
            "event": EVENT_FILTER,
            "begin": 1_700_000_000,
            "ascending": "yes",
            "limit": PAGE_LIMIT,
        }
        assert calls[0]["auth"] == ("api", "key")

    def test_paging_urls_are_not_given_duplicate_params(self, monkeypatch):
        pages = [
            {"items": [event("delivered", 1)], "paging": {"next": "https://next/1"}},
            {"items": []},
        ]
        client, calls = self._client(monkeypatch, pages)

        list(client.iter_events("stujo.net", 1_700_000_000))

        # paging.next already encodes the query; re-sending params would reset
        # the cursor and loop over the first page forever.
        assert calls[1]["params"] is None

    def test_a_short_page_is_not_the_end_of_the_walk(self, monkeypatch):
        pages = [
            {"items": [event("delivered", 1)], "paging": {"next": "https://next/1"}},
            {"items": [event("delivered", 2)], "paging": {}},
        ]
        client, calls = self._client(monkeypatch, pages)

        events = list(client.iter_events("stujo.net", 1_700_000_000))

        assert [maillog_id(e) for e in events] == [1, 2]
        assert len(calls) == 2

    def test_ends_when_a_page_offers_no_next(self, monkeypatch):
        client, calls = self._client(monkeypatch, [{"items": [event("delivered", 1)]}])

        assert len(list(client.iter_events("stujo.net", 1_700_000_000))) == 1
        assert len(calls) == 1


class TestResolveBegin:
    def test_defaults_to_a_trailing_window_with_overlap(self):
        begin, description = resolve_begin({})

        age = datetime.now(timezone.utc) - begin
        assert timedelta(hours=2, minutes=55) < age < timedelta(hours=3, minutes=5)
        assert description == "lookback=3.0h"

    def test_explicit_lookback_hours_wins(self):
        begin, description = resolve_begin({"lookbackHours": 72})

        age = datetime.now(timezone.utc) - begin
        assert timedelta(hours=71, minutes=55) < age < timedelta(hours=72, minutes=5)
        assert description == "lookback=72.0h"

    def test_explicit_begin_is_used_verbatim(self):
        begin, description = resolve_begin({"begin": "2026-09-05T00:00:00Z"})

        assert begin == datetime(2026, 9, 5, tzinfo=timezone.utc)
        assert "2026-09-05" in description

    def test_a_naive_begin_is_read_as_utc(self):
        begin, _ = resolve_begin({"begin": "2026-09-05T00:00:00"})

        assert begin.tzinfo is not None
        assert begin == datetime(2026, 9, 5, tzinfo=timezone.utc)

    def test_an_ancient_begin_is_clamped_rather_than_walking_all_history(self):
        begin, _ = resolve_begin({"begin": "2019-01-01T00:00:00Z"})

        age = datetime.now(timezone.utc) - begin
        assert age <= timedelta(hours=MAX_LOOKBACK_HOURS) + timedelta(minutes=1)

    def test_an_unusable_lookback_falls_back_to_the_default(self):
        begin, description = resolve_begin({"lookbackHours": "soon"})

        age = datetime.now(timezone.utc) - begin
        assert timedelta(hours=2, minutes=55) < age < timedelta(hours=3, minutes=5)
        assert description == "lookback=3.0h"

    def test_a_non_dict_payload_is_tolerated(self):
        begin, description = resolve_begin(None)

        assert description == "lookback=3.0h"
        assert begin < datetime.now(timezone.utc)


class TestCollectStatuses:
    def test_reduces_events_to_one_status_per_mail(self):
        client = FakeMailgunClient({
            "stujo.net": [
                event("delivered", 1),
                event("failed", 2, severity="permanent"),
                event("failed", 3, severity="temporary"),
                event("complained", 4),
            ]
        })

        statuses, counts, failed = collect_statuses(client, datetime.now(timezone.utc))

        assert statuses == {1: STATUS_DELIVERED, 2: STATUS_BOUNCED, 4: STATUS_COMPLAINED}
        assert counts == {STATUS_DELIVERED: 1, STATUS_BOUNCED: 1, STATUS_COMPLAINED: 1}
        assert failed == []

    def test_the_stronger_status_wins_regardless_of_event_order(self):
        # A delivered mail can still be reported as spam afterwards, and the
        # events do not necessarily arrive in that order.
        forward = FakeMailgunClient({"d": [event("delivered", 1), event("complained", 1)]})
        reverse = FakeMailgunClient({"d": [event("complained", 1), event("delivered", 1)]})

        assert collect_statuses(forward, datetime.now(timezone.utc))[0] == {1: STATUS_COMPLAINED}
        assert collect_statuses(reverse, datetime.now(timezone.utc))[0] == {1: STATUS_COMPLAINED}

    def test_a_temporary_failure_does_not_mask_a_later_delivery(self):
        client = FakeMailgunClient({
            "d": [event("failed", 1, severity="temporary"), event("delivered", 1)]
        })

        statuses, counts, _ = collect_statuses(client, datetime.now(timezone.utc))

        assert statuses == {1: STATUS_DELIVERED}
        assert counts[STATUS_BOUNCED] == 0

    def test_unkeyed_events_still_count_toward_the_rate(self):
        # Mail sent before v:maillogId existed cannot be attributed to a row,
        # but it is still evidence about the recipient list.
        client = FakeMailgunClient({
            "d": [event("failed", severity="permanent"), event("delivered")]
        })

        statuses, counts, _ = collect_statuses(client, datetime.now(timezone.utc))

        assert statuses == {}
        assert counts[STATUS_BOUNCED] == 1
        assert counts[STATUS_DELIVERED] == 1

    def test_one_failing_domain_does_not_lose_the_others(self):
        client = FakeMailgunClient(
            {"stujo.net": [event("delivered", 1)], "edu.opencampus.sh": []},
            failing=["edu.opencampus.sh"],
        )

        statuses, counts, failed = collect_statuses(client, datetime.now(timezone.utc))

        assert statuses == {1: STATUS_DELIVERED}
        assert [entry["domain"] for entry in failed] == ["edu.opencampus.sh"]

    def test_every_domain_is_read_from_the_same_window(self):
        begin = datetime(2026, 9, 5, tzinfo=timezone.utc)
        client = FakeMailgunClient({"a": [], "b": []})

        collect_statuses(client, begin)

        assert client.begins == [("a", begin.timestamp()), ("b", begin.timestamp())]


class TestApplyStatuses:
    def test_writes_one_mutation_per_status(self):
        client = FakeEduHubClient()

        applied = apply_statuses(client, {1: STATUS_DELIVERED, 2: STATUS_DELIVERED, 3: STATUS_BOUNCED})

        assert applied == {STATUS_DELIVERED: 2, STATUS_BOUNCED: 1}
        assert len(client.calls) == 2

    def test_delivered_never_overwrites_a_terminal_status(self):
        client = FakeEduHubClient()

        apply_statuses(client, {1: STATUS_DELIVERED})

        where = client.calls[0]["variables"]["where"]
        blocked = where["_or"][1]["status"]["_nin"]
        assert set(blocked) == {STATUS_DELIVERED, STATUS_BOUNCED, STATUS_COMPLAINED}

    def test_complained_is_blocked_only_by_itself(self):
        client = FakeEduHubClient()

        apply_statuses(client, {1: STATUS_COMPLAINED})

        where = client.calls[0]["variables"]["where"]
        # Nothing outranks a complaint, so the only row it skips is one that is
        # already COMPLAINED -- re-confirming it would just bump updated_at.
        assert where["_or"][1]["status"]["_nin"] == [STATUS_COMPLAINED]

    def test_rows_without_a_status_are_still_matched(self):
        # MailLog.status is nullable and NOT IN never matches NULL, so the null
        # case has to be spelled out or those rows would be skipped forever.
        client = FakeEduHubClient()

        apply_statuses(client, {1: STATUS_BOUNCED})

        where = client.calls[0]["variables"]["where"]
        assert {"status": {"_is_null": True}} in where["_or"]

    def test_the_stronger_write_is_applied_last(self):
        client = FakeEduHubClient()

        apply_statuses(client, {1: STATUS_COMPLAINED, 2: STATUS_DELIVERED, 3: STATUS_BOUNCED})

        order = [call["variables"]["status"] for call in client.calls]
        assert order == [STATUS_DELIVERED, STATUS_BOUNCED, STATUS_COMPLAINED]

    def test_ids_are_chunked(self, monkeypatch):
        monkeypatch.setattr(
            "pythonFunctions.sync_mail_delivery_status.UPDATE_CHUNK_SIZE", 2
        )
        client = FakeEduHubClient()

        applied = apply_statuses(client, {i: STATUS_DELIVERED for i in range(5)})

        assert [len(c["variables"]["where"]["id"]["_in"]) for c in client.calls] == [2, 2, 1]
        assert applied == {STATUS_DELIVERED: 5}

    def test_a_failed_chunk_does_not_abort_the_rest(self, monkeypatch):
        monkeypatch.setattr(
            "pythonFunctions.sync_mail_delivery_status.UPDATE_CHUNK_SIZE", 2
        )
        client = FakeEduHubClient(responses=[
            {"errors": [{"message": "boom"}]},
            {"data": {"update_MailLog": {"affected_rows": 2}}},
        ])

        applied = apply_statuses(client, {i: STATUS_DELIVERED for i in range(4)})

        assert applied == {STATUS_DELIVERED: 2}

    def test_nothing_to_do_makes_no_calls(self):
        client = FakeEduHubClient()

        assert apply_statuses(client, {}) == {}
        assert client.calls == []


class TestBounceRate:
    def test_complaints_are_excluded_from_the_denominator(self):
        # A complaint is a delivered mail the recipient disliked, not a delivery
        # failure; counting it would dilute the signal.
        rate, decided = bounce_rate(
            {STATUS_DELIVERED: 90, STATUS_BOUNCED: 10, STATUS_COMPLAINED: 100}
        )

        assert decided == 100
        assert rate == pytest.approx(0.10)

    def test_an_empty_window_is_not_a_division_by_zero(self):
        assert bounce_rate({STATUS_DELIVERED: 0, STATUS_BOUNCED: 0, STATUS_COMPLAINED: 0}) == (0.0, 0)


class TestCheckBounceThreshold:
    def counts(self, delivered, bounced, complained=0):
        return {
            STATUS_DELIVERED: delivered,
            STATUS_BOUNCED: bounced,
            STATUS_COMPLAINED: complained,
        }

    def test_a_healthy_window_raises_nothing(self):
        client = FakeEduHubClient()

        assert check_bounce_threshold(client, self.counts(1000, 5), "lookback=3.0h") is None
        assert client.calls == []

    def test_a_small_sample_is_not_an_alert(self):
        # 2 of 3 is 67% and means nothing.
        client = FakeEduHubClient()

        assert check_bounce_threshold(client, self.counts(1, 2), "lookback=3.0h") is None
        assert client.calls == []

    def test_a_bad_recipient_list_alerts_and_mails(self, monkeypatch):
        monkeypatch.setenv("MAIL_DELIVERY_ALERT_EMAIL", "admin@opencampus.sh")
        monkeypatch.setenv("MAILGUN_DOMAIN", "edu.opencampus.sh")
        # The shape of the cutover incident: a big batch, a quarter of it dead.
        client = FakeEduHubClient(responses=[
            {"data": {"MailLog": []}},
            {"data": {"insert_MailLog_one": {"id": 99}}},
        ])

        alert = check_bounce_threshold(client, self.counts(750, 250), "lookback=3.0h")

        assert alert["bounceRatePercent"] == 25.0
        assert alert["bounced"] == 250
        assert alert["mailed"] is True

        queued = client.calls[-1]["variables"]
        assert queued["to"] == "admin@opencampus.sh"
        assert queued["from"] == "noreply@edu.opencampus.sh"
        assert queued["metadata"] == {
            "type": "MAIL_DELIVERY_BOUNCE_ALERT",
            "day": datetime.now(timezone.utc).date().isoformat(),
        }
        assert "25.0%" in queued["subject"]

    def test_the_alert_is_sent_at_most_once_a_day(self, monkeypatch):
        monkeypatch.setenv("MAIL_DELIVERY_ALERT_EMAIL", "admin@opencampus.sh")
        day = datetime.now(timezone.utc).date().isoformat()
        # An alert mail for today is already in MailLog.
        client = FakeEduHubClient(responses=[
            {"data": {"MailLog": [{"metadata": {"type": "MAIL_DELIVERY_BOUNCE_ALERT", "day": day}}]}}
        ])

        alert = check_bounce_threshold(client, self.counts(750, 250), "lookback=3.0h")

        # Still reported to the caller and still logged, just not re-mailed --
        # the alert itself is mail, so a broken mail path must not amplify.
        assert alert["bounceRatePercent"] == 25.0
        assert alert["mailed"] is False
        assert len(client.calls) == 1

    def test_a_missing_recipient_still_reports_the_alert(self, monkeypatch):
        monkeypatch.delenv("MAIL_DELIVERY_ALERT_EMAIL", raising=False)
        monkeypatch.delenv("STUJO_ADMIN_EMAIL", raising=False)
        client = FakeEduHubClient()

        alert = check_bounce_threshold(client, self.counts(750, 250), "lookback=3.0h")

        assert alert["mailed"] is False
        assert client.calls == []

    def test_it_falls_back_to_the_stujo_admin_address(self, monkeypatch):
        monkeypatch.delenv("MAIL_DELIVERY_ALERT_EMAIL", raising=False)
        monkeypatch.setenv("STUJO_ADMIN_EMAIL", "stujo@opencampus.sh")
        client = FakeEduHubClient(responses=[
            {"data": {"MailLog": []}},
            {"data": {"insert_MailLog_one": {"id": 99}}},
        ])

        check_bounce_threshold(client, self.counts(750, 250), "lookback=3.0h")

        assert client.calls[-1]["variables"]["to"] == "stujo@opencampus.sh"

    def test_the_threshold_boundary_is_exclusive(self):
        client = FakeEduHubClient()
        # Exactly at the threshold is still healthy.
        at_threshold = self.counts(
            int(BOUNCE_RATE_MIN_SAMPLE * (1 - BOUNCE_RATE_THRESHOLD) * 10),
            int(BOUNCE_RATE_MIN_SAMPLE * BOUNCE_RATE_THRESHOLD * 10),
        )

        assert bounce_rate(at_threshold)[0] == pytest.approx(BOUNCE_RATE_THRESHOLD)
        assert check_bounce_threshold(client, at_threshold, "lookback=3.0h") is None
