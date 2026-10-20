"""Unit tests for the course-continuation inquiry threshold."""
import pytest

from pythonFunctions import check_course_continuation as mod

TEMPLATE = {
    "subject": "Please don't miss further sessions - [Enrollment:CourseId--Course:Name]",
    "content": "<p>Hi [User:FirstName]</p>",
    "from": "noreply@opencampus.sh",
    "cc": None,
    "bcc": None,
}


def _user(uid, email="jane@example.com"):
    return {"id": uid, "email": email, "firstName": "Jane", "lastName": "Doe"}


def _session(day, attendances, hour=8):
    return {"startDateTime": f"2026-10-{day:02d}T{hour:02d}:00:00+00:00", "Attendances": attendances}


def _attendance(attendance_id, uid, status, source="ZOOM"):
    return {"id": attendance_id, "userId": uid, "status": status, "source": source}


def _course(course_id, max_missed, enrolled_users, missed_by_user):
    """Builds a Course node as the Hasura query returns it.

    ``missed_by_user`` maps a user id to how many days that user missed;
    each of those becomes its own session, on its own day, with one MISSED
    attendance.
    """
    sessions = []
    for uid, count in missed_by_user.items():
        for _ in range(count):
            sessions.append(_session(len(sessions) + 1, [_attendance(len(sessions) + 1, uid, "MISSED")]))
    return {
        "id": course_id,
        "title": f"Course {course_id}",
        "maxMissedSessions": max_missed,
        "CourseEnrollments": [{"User": user} for user in enrolled_users],
        "Sessions": sessions,
    }


class FakeClient:
    def __init__(self, courses):
        self.courses = courses

    def send_query(self, query, variables):
        return {"data": {"Course": self.courses}}


@pytest.fixture
def run(monkeypatch):
    """Runs the function against canned courses, returning the queued mails."""

    def _run(courses):
        queued = []
        monkeypatch.setattr(mod, "EduHubClient", lambda: FakeClient(courses))
        monkeypatch.setattr(mod, "get_default_mail_template", lambda client, mail_type: TEMPLATE)
        monkeypatch.setattr(mod, "already_sent_keys", lambda client, mail_type, candidates, key_fields: set())

        def _queue_mail(client, template, to, replacements, metadata=None):
            queued.append({"to": to, "metadata": metadata, "replacements": replacements})
            return True

        monkeypatch.setattr(mod, "queue_mail", _queue_mail)
        result = mod.check_course_continuation({})
        assert result["success"] is True
        return queued

    return _run


class TestThreshold:
    def test_notifies_when_limit_is_reached(self, run):
        user = _user(1)
        queued = run([_course(7, 2, [user], {1: 2})])

        assert len(queued) == 1
        assert queued[0]["to"] == user["email"]
        assert queued[0]["metadata"] == {
            "type": mod.MAIL_TYPE,
            "courseId": 7,
            "userId": 1,
        }

    def test_notifies_when_limit_is_exceeded(self, run):
        assert len(run([_course(7, 2, [_user(1)], {1: 5})])) == 1

    def test_no_mail_below_the_limit(self, run):
        assert run([_course(7, 2, [_user(1)], {1: 1})]) == []

    def test_zero_limit_needs_one_actual_absence(self, run):
        # maxMissedSessions = 0 must not mail everyone who has been present.
        assert run([_course(7, 0, [_user(1)], {})]) == []
        assert len(run([_course(7, 0, [_user(1)], {1: 1})])) == 1

    def test_skips_users_without_email(self, run):
        assert run([_course(7, 1, [_user(1, email=None)], {1: 3})]) == []

    def test_skips_courses_without_limit(self, run):
        course = _course(7, None, [_user(1)], {1: 3})
        assert run([course]) == []


def test_only_mandatory_sessions_are_counted(monkeypatch):
    """Optional sessions are tracked but must not push anyone over the limit,
    so the course query only fetches missed attendances of mandatory sessions."""
    queries = []

    class RecordingClient(FakeClient):
        def send_query(self, query, variables):
            queries.append(query)
            return super().send_query(query, variables)

    monkeypatch.setattr(mod, "EduHubClient", lambda: RecordingClient([]))
    monkeypatch.setattr(mod, "get_default_mail_template", lambda client, mail_type: TEMPLATE)
    assert mod.check_course_continuation({})["success"] is True
    assert "Sessions(where: {isMandatory: {_eq: true}})" in queries[0]


def test_mandatory_program_sessions_count_toward_the_limit(run):
    """A missed mandatory program session counts in every course of the program."""
    user = _user(1)
    course = _course(7, 2, [user], {1: 1})
    course["Program"] = {"Sessions": [_session(20, [_attendance(99, 1, "MISSED")])]}

    queued = run([course])

    assert len(queued) == 1


class TestMissedDays:
    def test_sessions_on_one_day_count_once(self):
        sessions = [
            _session(14, [_attendance(1, 1, "MISSED")], hour=8),
            _session(14, [_attendance(2, 1, "MISSED")], hour=13),
            # 21:30 UTC is still the 14th in Berlin.
            {**_session(14, [_attendance(3, 1, "MISSED")]), "startDateTime": "2026-10-14T21:30:00Z"},
            _session(15, [_attendance(4, 1, "MISSED")]),
        ]
        assert mod.missed_days_by_user(sessions) == {1: 2}

    def test_one_attended_session_makes_the_day_attended(self):
        sessions = [
            _session(14, [_attendance(1, 1, "MISSED")], hour=8),
            _session(14, [_attendance(2, 1, "ATTENDED")], hour=13),
        ]
        assert mod.missed_days_by_user(sessions) == {}

    def test_instructor_override_wins_over_automated_rows(self):
        sessions = [
            _session(14, [_attendance(5, 1, "MISSED", "ZOOM"), _attendance(3, 1, "ATTENDED", "INSTRUCTOR")]),
            _session(15, [_attendance(6, 1, "ATTENDED", "ZOOM"), _attendance(4, 1, "MISSED", "INSTRUCTOR")]),
        ]
        assert mod.missed_days_by_user(sessions) == {1: 1}

    def test_two_sessions_on_one_day_do_not_reach_a_limit_of_two(self, run):
        course = _course(7, 2, [_user(1)], {})
        course["Sessions"] = [
            _session(14, [_attendance(1, 1, "MISSED")], hour=8),
            _session(14, [_attendance(2, 1, "MISSED")], hour=13),
        ]
        assert run([course]) == []
