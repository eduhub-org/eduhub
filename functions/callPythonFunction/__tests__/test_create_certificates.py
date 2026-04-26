"""Unit tests for attendance row selection inside the certificate generator.

The INSTRUCTOR manual override must always beat automated rows (ZOOM /
LIMESURVEY / legacy NULL) when collapsing multiple Attendance rows for the
same (user, session) into a single effective row.
"""
from pythonFunctions.create_certificates import (
    CertificateCreator,
    pick_effective_attendance,
)


def _att(att_id, status, source, session_id=100):
    return {
        "id": att_id,
        "status": status,
        "source": source,
        "Session": {"id": session_id},
    }


class TestPickEffectiveAttendance:
    def test_returns_none_for_empty_list(self):
        assert pick_effective_attendance([]) is None

    def test_instructor_wins_over_newer_automated_row(self):
        instructor = _att(5, "MISSED", "INSTRUCTOR")
        zoom_later = _att(10, "ATTENDED", "ZOOM")
        result = pick_effective_attendance([instructor, zoom_later])
        assert result is instructor

    def test_instructor_wins_regardless_of_insertion_order(self):
        zoom_later = _att(10, "ATTENDED", "ZOOM")
        instructor = _att(5, "MISSED", "INSTRUCTOR")
        result = pick_effective_attendance([zoom_later, instructor])
        assert result is instructor

    def test_latest_instructor_row_wins_on_repeated_toggles(self):
        first_toggle = _att(7, "ATTENDED", "INSTRUCTOR")
        second_toggle = _att(12, "MISSED", "INSTRUCTOR")
        third_toggle = _att(20, "ATTENDED", "INSTRUCTOR")
        zoom = _att(3, "ATTENDED", "ZOOM")
        result = pick_effective_attendance(
            [first_toggle, zoom, third_toggle, second_toggle]
        )
        assert result is third_toggle

    def test_fallback_to_highest_id_when_no_instructor(self):
        zoom_old = _att(3, "MISSED", "ZOOM")
        limesurvey_new = _att(8, "ATTENDED", "LIMESURVEY")
        result = pick_effective_attendance([zoom_old, limesurvey_new])
        assert result is limesurvey_new

    def test_null_source_treated_as_automated(self):
        legacy_null = _att(3, "ATTENDED", None)
        instructor = _att(1, "MISSED", "INSTRUCTOR")
        result = pick_effective_attendance([legacy_null, instructor])
        assert result is instructor


class TestGetAttendedSessionsInstructorPrecedence:
    """`CertificateCreator.get_attended_sessions` selects one Attendance row
    per session and only keeps sessions whose effective status is ATTENDED.
    These tests exercise the method via __new__ to skip the real __init__
    (which requires a Hasura / GCS connection).
    """

    @staticmethod
    def _creator():
        return CertificateCreator.__new__(CertificateCreator)

    def test_instructor_missed_overrides_zoom_attended(self):
        """Even if a later ZOOM row says ATTENDED, the instructor's MISSED
        override must remove the session from the attendance certificate."""
        session = {"id": 100, "title": "Session 1", "startDateTime": "2026-01-01"}
        enrollment = {
            "User": {
                "Attendances": [
                    _att(5, "MISSED", "INSTRUCTOR", session_id=100),
                    _att(10, "ATTENDED", "ZOOM", session_id=100),
                ]
            }
        }
        result = self._creator().get_attended_sessions(enrollment, [session])
        assert result == []

    def test_instructor_attended_overrides_zoom_missed(self):
        session = {"id": 100, "title": "Session 1", "startDateTime": "2026-01-01"}
        enrollment = {
            "User": {
                "Attendances": [
                    _att(10, "MISSED", "ZOOM", session_id=100),
                    _att(5, "ATTENDED", "INSTRUCTOR", session_id=100),
                ]
            }
        }
        result = self._creator().get_attended_sessions(enrollment, [session])
        assert result == ["Session 1"]

    def test_fallback_to_newest_row_when_no_instructor(self):
        session = {"id": 100, "title": "Session 1", "startDateTime": "2026-01-01"}
        enrollment = {
            "User": {
                "Attendances": [
                    _att(3, "MISSED", "ZOOM", session_id=100),
                    _att(8, "ATTENDED", "LIMESURVEY", session_id=100),
                ]
            }
        }
        result = self._creator().get_attended_sessions(enrollment, [session])
        assert result == ["Session 1"]

    def test_latest_instructor_toggle_wins(self):
        session = {"id": 100, "title": "Session 1", "startDateTime": "2026-01-01"}
        enrollment = {
            "User": {
                "Attendances": [
                    _att(7, "ATTENDED", "INSTRUCTOR", session_id=100),
                    _att(12, "MISSED", "INSTRUCTOR", session_id=100),
                ]
            }
        }
        result = self._creator().get_attended_sessions(enrollment, [session])
        assert result == []

    def test_sessions_sorted_by_start_date(self):
        session_later = {"id": 100, "title": "Second", "startDateTime": "2026-02-01"}
        session_earlier = {"id": 101, "title": "First", "startDateTime": "2026-01-01"}
        enrollment = {
            "User": {
                "Attendances": [
                    _att(1, "ATTENDED", "INSTRUCTOR", session_id=100),
                    _att(2, "ATTENDED", "ZOOM", session_id=101),
                ]
            }
        }
        result = self._creator().get_attended_sessions(
            enrollment, [session_later, session_earlier]
        )
        assert result == ["First", "Second"]
