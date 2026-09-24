"""Unit tests for the invitation expiry cron.

invitationExpirationDate is a Postgres date. The job used to compare it against
timestamptz variables, which Hasura rejects, so it failed on every run. These
tests pin the date typing and the day rules: remind on the last day, expire
once that day is over, and only within the grace window so the first working
run does not mail every invitation that ever lapsed. "Today" is the
Europe/Berlin day, including right after midnight in summer and winter time.
"""
from datetime import datetime, timezone

import pytest

from pythonFunctions import expire_invitations as mod

# 12:00 in Berlin on 2026-09-24.
NOON_BERLIN = datetime(2026, 9, 24, 10, 0, tzinfo=timezone.utc)

TEMPLATE = {
    "subject": "Your invitation expires soon - [Enrollment:CourseId--Course:Name]",
    "content": "<p>Hi [User:FirstName]</p>",
    "from": "noreply@opencampus.sh",
    "cc": None,
    "bcc": None,
}

ENROLLMENT = {
    "id": 11,
    "invitationExpirationDate": "2026-09-24",
    "User": {"email": "jane@example.com", "firstName": "Jane", "lastName": "Doe"},
    "Course": {"id": 7, "title": "Course 7"},
}


def frozen_datetime(instant):
    class FrozenDatetime(datetime):
        @classmethod
        def now(cls, tz=None):
            return instant.astimezone(tz)

    return FrozenDatetime


class FakeClient:
    def __init__(self):
        self.calls = []

    def send_query(self, query, variables):
        self.calls.append({"query": query, "variables": variables})
        if "update_CourseEnrollment" in query:
            return {"data": {"update_CourseEnrollment": {"affected_rows": 2}}}
        return {"data": {"CourseEnrollment": [ENROLLMENT]}}


@pytest.fixture
def run_at(monkeypatch):
    """Runs the job at a UTC instant, returning the client and queued mails."""

    def _run(instant):
        client = FakeClient()
        queued = []
        monkeypatch.setattr(mod, "datetime", frozen_datetime(instant))
        monkeypatch.setattr(mod, "EduHubClient", lambda: client)
        monkeypatch.setattr(mod, "get_default_mail_template", lambda client, mail_type: TEMPLATE)
        monkeypatch.setattr(mod, "already_sent_keys", lambda client, mail_type, candidates, key_fields: set())

        def _queue_mail(client, template, to, replacements, metadata=None):
            queued.append({"to": to, "metadata": metadata})
            return True

        monkeypatch.setattr(mod, "queue_mail", _queue_mail)
        result = mod.expire_invitations({})
        assert result == {"success": True, "data": {"remindedCount": 1, "expiredCount": 2}}
        return client, queued

    return _run


@pytest.fixture
def run(run_at):
    return run_at(NOON_BERLIN)


def _compact(query):
    return " ".join(query.split())


def test_resolves_the_berlin_time_zone():
    assert mod.INVITATION_TIME_ZONE is not None


def test_types_expiration_variables_as_date(run):
    client, _ = run
    for call in client.calls:
        assert "timestamptz" not in call["query"]
        assert "$today: date!" in call["query"]


@pytest.mark.parametrize(
    "instant, berlin_day",
    [
        # 00:30 CEST: the UTC day is still the 23rd.
        (datetime(2026, 9, 23, 22, 30, tzinfo=timezone.utc), "2026-09-24"),
        # 23:59 CEST: still the 23rd in Berlin.
        (datetime(2026, 9, 23, 21, 59, tzinfo=timezone.utc), "2026-09-23"),
        # 00:30 CET in winter time.
        (datetime(2026, 12, 1, 23, 30, tzinfo=timezone.utc), "2026-12-02"),
    ],
)
def test_uses_the_berlin_day_around_midnight(run_at, instant, berlin_day):
    client, _ = run_at(instant)

    assert client.calls[0]["variables"] == {"today": berlin_day}
    assert client.calls[-1]["variables"]["today"] == berlin_day


def test_reminds_invitations_on_their_last_day(run):
    client, queued = run
    reminder = client.calls[0]

    assert "invitationExpirationDate: {_eq: $today}" in _compact(reminder["query"])
    assert reminder["variables"] == {"today": "2026-09-24"}
    assert queued == [
        {
            "to": "jane@example.com",
            "metadata": {
                "type": mod.MAIL_TYPE,
                "enrollmentId": 11,
                "invitationExpirationDate": "2026-09-24",
            },
        }
    ]


def test_expires_only_invitations_lapsed_within_the_grace_window(run):
    client, _ = run
    expire = client.calls[-1]

    assert "invitationExpirationDate: {_lt: $today, _gte: $graceStart}" in _compact(expire["query"])
    assert expire["variables"] == {"today": "2026-09-24", "graceStart": "2026-09-21"}
