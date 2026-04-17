"""Unit tests for the attendance matching / row preparation logic."""
import pandas as pd
import pytest

from pythonFunctions.check_attendance import (
    MATCH_TYPE_EMAIL,
    MATCH_TYPE_NAME,
    MATCH_TYPE_NONE,
    prepare_participant_attendance_data,
)


SESSION_ID = 42


def _participant(first="Jane", last="Doe", email="jane@example.com"):
    return pd.Series(
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "firstName": first,
            "lastName": last,
            "email": email,
        }
    )


def _attendance_df(rows):
    df = pd.DataFrame(rows)
    # Ensure all expected columns exist even when a given test omits them.
    for col in (
        "name",
        "email",
        "joinDateTime",
        "leaveDateTime",
        "duration",
        "interruptionCount",
        "source",
        "location",
    ):
        if col not in df.columns:
            df[col] = None
    return df


class TestPrepareParticipantAttendanceData:
    def test_email_match_wins_over_fuzzy_name(self):
        # Display name in Zoom is a company account that doesn't match the
        # enrolled user's real name at all, but the email does.
        att = _attendance_df(
            [
                {
                    "name": "Work Laptop",
                    "email": "jane@example.com",
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T11:00:00+00:00",
                    "duration": 3600,
                    "interruptionCount": 0,
                    "source": "ZOOM",
                    "location": "ZOOM",
                },
                {
                    "name": "Jane Doe",
                    "email": "someone_else@example.com",
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T10:30:00+00:00",
                    "duration": 1800,
                    "interruptionCount": 0,
                    "source": "ZOOM",
                    "location": "ZOOM",
                },
            ]
        )

        result = prepare_participant_attendance_data(
            _participant(), att, SESSION_ID
        )
        row = result.iloc[0]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_EMAIL
        assert row["recordedIdentifier"] == "jane@example.com"
        assert row["duration"] == 3600

    def test_email_match_is_case_insensitive(self):
        att = _attendance_df(
            [
                {
                    "name": "jd",
                    "email": "JANE@EXAMPLE.COM",
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T11:00:00+00:00",
                    "duration": 3600,
                    "interruptionCount": 0,
                    "source": "ZOOM",
                    "location": "ZOOM",
                }
            ]
        )
        result = prepare_participant_attendance_data(
            _participant(email="jane@example.com"), att, SESSION_ID
        )
        row = result.iloc[0]
        assert row["matchType"] == MATCH_TYPE_EMAIL
        assert row["recordedIdentifier"] == "jane@example.com"

    def test_falls_back_to_fuzzy_name_match(self):
        att = _attendance_df(
            [
                {
                    "name": "Jane Doe",
                    "email": None,
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T10:30:00+00:00",
                    "duration": 1800,
                    "interruptionCount": 0,
                    "source": "ZOOM",
                    "location": "ZOOM",
                }
            ]
        )
        result = prepare_participant_attendance_data(
            _participant(email=None), att, SESSION_ID
        )
        row = result.iloc[0]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_NAME
        assert row["recordedIdentifier"] == "Jane Doe"

    def test_no_match_records_closest_candidate_as_none(self):
        att = _attendance_df(
            [
                {
                    "name": "Completely Unrelated Person",
                    "email": "other@example.com",
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T10:30:00+00:00",
                    "duration": 1800,
                    "interruptionCount": 0,
                    "source": "ZOOM",
                    "location": "ZOOM",
                }
            ]
        )
        result = prepare_participant_attendance_data(
            _participant(), att, SESSION_ID
        )
        row = result.iloc[0]
        assert row["status"] == "MISSED"
        assert row["matchType"] == MATCH_TYPE_NONE
        # Closest candidate is kept for audit purposes.
        assert row["recordedIdentifier"] == "other@example.com"

    def test_empty_attendance_data_yields_missed_row(self):
        result = prepare_participant_attendance_data(
            _participant(), pd.DataFrame(), SESSION_ID
        )
        row = result.iloc[0]
        assert row["status"] == "MISSED"
        assert row["matchType"] == MATCH_TYPE_NONE
        assert row["recordedIdentifier"] is None
        assert row["sessionId"] == SESSION_ID
