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


def _course(course_id, max_missed, enrolled_users, missed_by_user):
    """Builds a Course node as the Hasura query returns it.

    ``missed_by_user`` maps a user id to how many MISSED attendances that
    user has; each of those becomes its own session with one attendance.
    """
    sessions = []
    for uid, count in missed_by_user.items():
        for _ in range(count):
            sessions.append({"Attendances": [{"userId": uid}]})
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
