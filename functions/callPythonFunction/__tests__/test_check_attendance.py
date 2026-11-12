"""Unit tests for the attendance matching / row preparation logic."""
import pandas as pd
import pytest

from pythonFunctions.check_attendance import (
    MATCH_TYPE_EMAIL,
    MATCH_TYPE_NAME,
    MATCH_TYPE_NONE,
    MATCH_TYPE_PARTIAL_NAME,
    clean_display_name,
    match_participants,
)


SESSION = {
    "id": 42,
    "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
    "endDateTime": pd.Timestamp("2026-01-01T11:00:00Z"),
}


def _participants(*people):
    rows = [
        {
            "id": f"u-{i}",
            "firstName": first,
            "lastName": last,
            "email": email,
        }
        for i, (first, last, email) in enumerate(people)
    ]
    return pd.DataFrame(rows, columns=["id", "firstName", "lastName", "email"])


def _zoom(name, email=None, duration=3600):
    return {
        "name": name,
        "email": email,
        "joinDateTime": "2026-01-01T10:00:00+00:00",
        "leaveDateTime": "2026-01-01T11:00:00+00:00",
        "duration": duration,
        "interruptionCount": 0,
        "source": "ZOOM",
        "location": "ZOOM",
    }


def _check_in(name, place="Starterkitchen"):
    return {
        "name": name,
        "email": None,
        "joinDateTime": "2026-01-01T09:55:00+00:00",
        "leaveDateTime": None,
        "duration": None,
        "interruptionCount": None,
        "source": "LIMESURVEY",
        "location": place,
    }


def _records(rows):
    return pd.DataFrame(
        rows,
        columns=[
            "name",
            "email",
            "joinDateTime",
            "leaveDateTime",
            "duration",
            "interruptionCount",
            "source",
            "location",
        ],
    )


def _match(participants, records):
    return {row["userId"]: row for row in match_participants(participants, records, SESSION)}


JANE = ("Jane", "Doe", "jane@example.com")


class TestMatchParticipants:
    def test_email_match_wins_over_fuzzy_name(self):
        # Display name in Zoom is a company account that doesn't match the
        # enrolled user's real name at all, but the email does.
        records = _records(
            [_zoom("Work Laptop", "jane@example.com"), _zoom("Jane Doe", "someone_else@example.com", 1800)]
        )
        row = _match(_participants(JANE), records)["u-0"]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_EMAIL
        assert row["recordedIdentifier"] == "jane@example.com"
        assert row["duration"] == 3600
        assert row["attendanceRecordIndex"] == 0
        assert row["matchScore"] is None

    def test_email_match_is_case_insensitive(self):
        records = _records([_zoom("jd", "JANE@EXAMPLE.COM")])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["matchType"] == MATCH_TYPE_EMAIL
        assert row["recordedIdentifier"] == "jane@example.com"

    def test_falls_back_to_fuzzy_name_match(self):
        records = _records([_zoom("Jane Doe")])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_NAME
        assert row["matchScore"] == 100

    def test_no_match_lists_closest_candidate_per_location(self):
        records = _records([_zoom("Totally Different"), _check_in("Janet Dorn")])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["status"] == "MISSED"
        assert row["matchType"] == MATCH_TYPE_NONE
        assert row["attendanceRecordIndex"] is None
        locations = [c["location"] for c in row["closestCandidates"]]
        assert sorted(locations) == ["KIEL", "ONLINE"]
        assert row["closestCandidates"][0]["identifier"] == "Janet Dorn"
        assert row["recordedIdentifier"] == "Janet Dorn"

    def test_empty_records_yield_missed_row(self):
        row = _match(_participants(JANE), _records([]))["u-0"]
        assert row["status"] == "MISSED"
        assert row["matchType"] == MATCH_TYPE_NONE
        assert row["closestCandidates"] is None

    def test_short_zoom_stay_is_missed_but_keeps_match(self):
        records = _records([_zoom("Jane Doe", duration=1200)])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["status"] == "MISSED"
        assert row["matchType"] == MATCH_TYPE_NAME
        assert row["duration"] == 1200
        assert row["attendanceRecordIndex"] == 0

    def test_check_in_counts_over_short_zoom_stay(self):
        records = _records([_zoom("Jane Doe", duration=600), _check_in("Jane Doe")])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["status"] == "ATTENDED"
        assert row["source"] == "LIMESURVEY"
        assert row["location"] == "Starterkitchen"

    def test_check_in_wins_when_both_count(self):
        records = _records([_zoom("Jane Doe"), _check_in("Jane Doe")])
        row = _match(_participants(JANE), records)["u-0"]
        assert row["source"] == "LIMESURVEY"

    def test_single_first_name_matches_when_unique(self):
        participants = _participants(("Christine", "Avery", "c@example.com"), ("Hellena", "Sam", "h@example.com"))
        records = _records([_zoom("Christine"), _zoom("Hellena")])
        result = _match(participants, records)
        assert result["u-0"]["status"] == "ATTENDED"
        assert result["u-0"]["matchType"] == MATCH_TYPE_PARTIAL_NAME
        assert result["u-1"]["status"] == "ATTENDED"

    def test_single_first_name_ignored_when_ambiguous(self):
        participants = _participants(
            ("Christian", "Diestel", "a@example.com"), ("Christian", "Hase", "b@example.com")
        )
        result = _match(participants, _records([_zoom("Christian")]))
        assert {row["status"] for row in result.values()} == {"MISSED"}

    def test_initial_and_last_name(self):
        participants = _participants(("Hyun-Jin", "Lee", "x@example.com"), ("Jane", "Doe", "j@example.com"))
        result = _match(participants, _records([_zoom("HLee")]))
        assert result["u-0"]["status"] == "ATTENDED"
        assert result["u-0"]["matchType"] == MATCH_TYPE_PARTIAL_NAME

    def test_handle_is_cleaned_before_fuzzy_matching(self):
        participants = _participants(("saikiran", "Panchireddi", "s@example.com"))
        records = _records([_zoom("@saikiran.panchireddi.20311a:opencampus.sh")])
        row = _match(participants, records)["u-0"]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_NAME

    def test_each_record_goes_to_one_participant(self):
        participants = _participants(("Jane", "Doe", "j1@example.com"), ("Jane", "Doe", "j2@example.com"))
        result = _match(participants, _records([_zoom("Jane Doe")]))
        statuses = sorted(row["status"] for row in result.values())
        assert statuses == ["ATTENDED", "MISSED"]

    def test_typo_in_first_letter_of_last_name_still_matches(self):
        # token_sort_ratio alone sorts "dann léa" vs "léa sann" and scores 43.
        participants = _participants(("Léa", "Sann", "l@example.com"), ("Lakshay", "Panwar", "p@example.com"))
        result = _match(participants, _records([_check_in("Léa Dann")]))
        assert result["u-0"]["status"] == "ATTENDED"
        assert result["u-0"]["matchType"] == MATCH_TYPE_NAME
        assert result["u-1"]["status"] == "MISSED"

    def test_decomposed_accents_are_normalised(self):
        import unicodedata

        participants = _participants(("Léa", "Sann", "l@example.com"))
        records = _records([_check_in(unicodedata.normalize("NFD", "Léa Sann"))])
        row = _match(participants, records)["u-0"]
        assert row["matchType"] == MATCH_TYPE_NAME
        assert row["matchScore"] == 100

    def test_missing_middle_name_still_matches(self):
        participants = _participants(("Marlena Isabella", "Ruzicka", "m@example.com"))
        row = _match(participants, _records([_check_in("Marlena Ruzicka")]))["u-0"]
        assert row["status"] == "ATTENDED"
        assert row["matchType"] == MATCH_TYPE_NAME

    def test_shared_first_name_alone_is_no_full_name_match(self):
        participants = _participants(("Anna", "Mühlenbeck", "a@example.com"))
        row = _match(participants, _records([_check_in("Anna-Lena Wentzel")]))["u-0"]
        assert row["status"] == "MISSED"

    def test_record_goes_to_the_better_match(self):
        participants = _participants(("Jan", "Winkel", "a@example.com"), ("Jana", "Winkel", "b@example.com"))
        result = _match(participants, _records([_zoom("Jana Winkel")]))
        assert result["u-1"]["status"] == "ATTENDED"
        assert result["u-0"]["status"] == "MISSED"


def test_clean_display_name():
    assert clean_display_name("@saikiran.panchireddi.20311a:opencampus.sh") == "saikiran panchireddi"
    assert clean_display_name("Hase, Christian") == "hase christian"
    assert clean_display_name(None) == ""


class TestCheckAttendanceOrchestration:
    def test_email_and_fuzzy_matches_are_inserted_with_correct_match_types(
        self, monkeypatch
    ):
        """End-to-end-ish smoke: one ATTENDED-via-email, one
        ATTENDED-via-name, one MISSED (no match)."""
        from pythonFunctions import check_attendance as mod

        session = {
            "id": 1,
            "title": "Demo session",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "Course": {
                "CourseLocations": [
                    {
                        "locationOption": "ONLINE",
                        "defaultSessionAddress": "https://zoom.us/j/123",
                    }
                ]
            },
            "SessionAddresses": [],
        }

        zoom_df = pd.DataFrame(
            [
                # Alice matches by email despite a completely different
                # display name.
                {
                    "name": "Work Laptop",
                    "email": "alice@example.com",
                    "joinDateTime": "2026-01-01T10:05:00+00:00",
                    "leaveDateTime": "2026-01-01T11:25:00+00:00",
                    "duration": 4800,
                    "interruptionCount": 0,
                },
                # Bob matches by fuzzy name (no email on the source row).
                {
                    "name": "Bob Builder",
                    "email": None,
                    "joinDateTime": "2026-01-01T10:10:00+00:00",
                    "leaveDateTime": "2026-01-01T11:20:00+00:00",
                    "duration": 4200,
                    "interruptionCount": 0,
                },
            ]
        )

        participants_df = pd.DataFrame(
            [
                {
                    "id": "u-alice",
                    "firstName": "Alice",
                    "lastName": "Wonderland",
                    "email": "alice@example.com",
                },
                {
                    "id": "u-bob",
                    "firstName": "Bob",
                    "lastName": "Builder",
                    "email": "bob@example.com",
                },
                {
                    "id": "u-carol",
                    "firstName": "Carol",
                    "lastName": "Noshow",
                    "email": "carol@example.com",
                },
            ]
        )

        class FakeEduHub:
            def __init__(self):
                self.url = "http://fake"
                self.inserts = []
                self.session_updates = []

            def get_finished_sessions_without_attendance_check(self):
                return [session]

            def get_course_participants_from_session_id(self, _sid):
                return participants_df

            def replace_session_attendances(self, sid, rows, records):
                self.inserts.extend(dict(row) for row in rows)
                self.session_updates.append((sid, records))

        class FakeZoom:
            def get_session_attendance(
                self, url, session_start=None, session_end=None
            ):
                return zoom_df.copy()

        fake_eduhub = FakeEduHub()
        monkeypatch.setattr(mod, "EduHubClient", lambda: fake_eduhub)
        monkeypatch.setattr(mod, "ZoomClient", lambda: FakeZoom())

        result = mod.check_attendance({})

        assert result["success"] is True
        assert len(fake_eduhub.inserts) == 3

        inserts_by_user = {row["userId"]: row for row in fake_eduhub.inserts}

        assert inserts_by_user["u-alice"]["status"] == "ATTENDED"
        assert inserts_by_user["u-alice"]["matchType"] == MATCH_TYPE_EMAIL
        assert inserts_by_user["u-alice"]["recordedIdentifier"] == "alice@example.com"

        assert inserts_by_user["u-bob"]["status"] == "ATTENDED"
        assert inserts_by_user["u-bob"]["matchType"] == MATCH_TYPE_NAME
        assert inserts_by_user["u-bob"]["recordedIdentifier"] == "Bob Builder"

        assert inserts_by_user["u-carol"]["status"] == "MISSED"
        assert inserts_by_user["u-carol"]["matchType"] == MATCH_TYPE_NONE
        # Session.attendanceData was written exactly once for the session,
        # so the cron won't re-process it.
        assert len(fake_eduhub.session_updates) == 1

    def test_zoom_attendance_error_skips_session_for_retry(self, monkeypatch):
        """When Zoom raises ZoomAttendanceError (partial instance data),
        check_attendance must NOT insert Attendance rows and must NOT
        write Session.attendanceData, so the session stays eligible for
        retry on the next cron run."""
        from pythonFunctions import check_attendance as mod
        from api_clients.zoom_client import ZoomAttendanceError

        session = {
            "id": 7,
            "title": "Flaky Zoom session",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "Course": {
                "CourseLocations": [
                    {
                        "locationOption": "ONLINE",
                        "defaultSessionAddress": "https://zoom.us/j/123",
                    }
                ]
            },
            "SessionAddresses": [],
        }

        class FakeEduHub:
            def __init__(self):
                self.url = "http://fake"
                self.inserts = []
                self.session_updates = []
                self.participants_calls = 0

            def get_finished_sessions_without_attendance_check(self):
                return [session]

            def get_course_participants_from_session_id(self, _sid):
                self.participants_calls += 1
                return pd.DataFrame(
                    [
                        {
                            "id": "u-alice",
                            "firstName": "Alice",
                            "lastName": "A",
                            "email": "a@example.com",
                        }
                    ]
                )

            def replace_session_attendances(self, sid, rows, records):
                self.inserts.extend(dict(row) for row in rows)
                self.session_updates.append((sid, records))

        class FakeZoom:
            def get_session_attendance(
                self, url, session_start=None, session_end=None
            ):
                raise ZoomAttendanceError(
                    "simulated partial instance failure",
                    meeting_id="123",
                    failed_uuids=["bad-uuid"],
                )

        fake_eduhub = FakeEduHub()
        monkeypatch.setattr(mod, "EduHubClient", lambda: fake_eduhub)
        monkeypatch.setattr(mod, "ZoomClient", lambda: FakeZoom())

        result = mod.check_attendance({})

        assert result["success"] is True
        # No Attendance rows inserted for this session.
        assert fake_eduhub.inserts == []
        # Session.attendanceData not touched -> still NULL -> retry next run.
        assert fake_eduhub.session_updates == []
        # And we never even queried participants (short-circuit before).
        assert fake_eduhub.participants_calls == 0

    def test_missing_zoom_credentials_leaves_online_sessions_unchecked(
        self, monkeypatch, caplog
    ):
        """Without Zoom credentials the cron run must not abort, and a
        session that needs Zoom stays unchecked (no wrong MISSED) so the
        next run retries it. Sessions that are on site only are still
        checked."""
        from pythonFunctions import check_attendance as mod

        mixed_session = {
            "id": 9,
            "title": "Mixed location session",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "Course": {
                "CourseLocations": [
                    {
                        "locationOption": "ONLINE",
                        "defaultSessionAddress": "https://zoom.us/j/123",
                    },
                    {
                        "locationOption": "KIEL",
                        "defaultSessionAddress": None,
                    },
                ]
            },
            "SessionAddresses": [],
        }
        on_site_session = {
            **mixed_session,
            "id": 10,
            "title": "On-site session",
            "Course": {"CourseLocations": [{"locationOption": "KIEL", "defaultSessionAddress": None}]},
        }

        offline_df = pd.DataFrame(
            [
                {
                    "name": "Bob Builder",
                    "email": None,
                    "joinDateTime": pd.Timestamp("2026-01-01T10:05:00Z"),
                    "leaveDateTime": None,
                    "duration": None,
                    "interruptionCount": None,
                    "location": "KI1",
                }
            ]
        )

        class FakeEduHub:
            def __init__(self):
                self.url = "http://fake"
                self.inserts = []
                self.session_updates = []

            def get_finished_sessions_without_attendance_check(self):
                return [mixed_session, on_site_session]

            def get_course_participants_from_session_id(self, _sid):
                return pd.DataFrame(
                    [
                        {
                            "id": "u-bob",
                            "firstName": "Bob",
                            "lastName": "Builder",
                            "email": "bob@example.com",
                        }
                    ]
                )

            def replace_session_attendances(self, sid, rows, records):
                self.inserts.extend(dict(row) for row in rows)
                self.session_updates.append((sid, records))

        fake_eduhub = FakeEduHub()
        monkeypatch.setattr(mod, "EduHubClient", lambda: fake_eduhub)

        for var in ("ZOOM_API_KEY", "ZOOM_API_SECRET", "ZOOM_ACCOUNT_ID"):
            monkeypatch.delenv(var, raising=False)

        def _boom():
            raise AssertionError("ZoomClient must not be instantiated when credentials are missing")

        monkeypatch.setattr(mod, "ZoomClient", _boom)
        monkeypatch.setattr(
            mod, "get_offline_session_attendance", lambda s, options=None: offline_df.copy()
        )

        import logging as _logging

        with caplog.at_level(_logging.WARNING):
            result = mod.check_attendance({})

        assert result["success"] is True
        assert any(
            "Zoom API credentials not configured" in rec.getMessage()
            for rec in caplog.records
        )
        # Only the on-site session was checked.
        assert [sid for sid, _ in fake_eduhub.session_updates] == [10]
        assert len(fake_eduhub.inserts) == 1
        assert fake_eduhub.inserts[0]["sessionId"] == 10
        assert fake_eduhub.inserts[0]["status"] == "ATTENDED"
        assert fake_eduhub.inserts[0]["matchType"] == MATCH_TYPE_NAME
        assert fake_eduhub.inserts[0]["source"] == "LIMESURVEY"

    def test_on_site_locations_share_one_survey_fetch(self, monkeypatch):
        """KIEL and HEIDE use the same check-in survey; it must be fetched
        once, or every check-in would appear twice."""
        from pythonFunctions import check_attendance as mod

        session = {
            "id": 11,
            "title": "Two sites",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "Course": {
                "CourseLocations": [
                    {"locationOption": "KIEL", "defaultSessionAddress": None},
                    {"locationOption": "HEIDE", "defaultSessionAddress": None},
                ]
            },
            "SessionAddresses": [],
        }
        fetches = []

        def _fetch(s, options=None):
            fetches.append(s["id"])
            return pd.DataFrame([{"name": "Bob Builder", "location": "Starterkitchen"}])

        monkeypatch.setattr(mod, "get_offline_session_attendance", _fetch)
        records, reason = mod.collect_attendance_records(session, None)
        assert reason is None
        assert fetches == [11]
        assert len(records) == 1
        assert list(records.columns) == mod.RECORD_COLUMNS

    def test_limesurvey_failure_leaves_session_unchecked(self, monkeypatch):
        from pythonFunctions import check_attendance as mod

        session = {
            "id": 12,
            "title": "On site",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "Course": {"CourseLocations": [{"locationOption": "KIEL", "defaultSessionAddress": None}]},
            "SessionAddresses": [],
        }

        def _fail(_s, options=None):
            raise RuntimeError("LimeSurvey down")

        monkeypatch.setattr(mod, "get_offline_session_attendance", _fail)
        records, reason = mod.collect_attendance_records(session, None)
        assert records is None
        assert "LimeSurvey down" in reason


# ----------------------------------------------------------------------
# Program-wide sessions
# ----------------------------------------------------------------------


class TestProgramSessions:
    def test_session_locations_come_from_session_addresses(self):
        from pythonFunctions.check_attendance import session_locations

        session = {
            "programId": 4,
            "Course": None,
            "SessionAddresses": [
                {"locationOption": "ONLINE", "address": "https://zoom.us/j/9", "LocationAddress": None},
                {"locationOption": "KIEL", "address": "", "LocationAddress": {"address": "Audimax"}},
                {"locationOption": None, "address": "legacy"},
            ],
        }

        assert session_locations(session) == [
            {"locationOption": "ONLINE", "defaultSessionAddress": "https://zoom.us/j/9"},
            {"locationOption": "KIEL", "defaultSessionAddress": "Audimax"},
        ]

    def test_program_session_uses_program_participants(self, monkeypatch):
        from pythonFunctions import check_attendance as mod

        session = {
            "id": 21,
            "title": "Program opening",
            "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
            "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
            "programId": 4,
            "Course": None,
            "SessionAddresses": [
                {"locationOption": "ONLINE", "address": "https://zoom.us/j/9", "LocationAddress": None}
            ],
        }
        participants_df = pd.DataFrame(
            [{"id": "u-alice", "firstName": "Alice", "lastName": "Wonderland", "email": "alice@example.com"}]
        )
        zoom_df = pd.DataFrame(
            [
                {
                    "name": "Alice",
                    "email": "alice@example.com",
                    "joinDateTime": "2026-01-01T10:00:00+00:00",
                    "leaveDateTime": "2026-01-01T11:25:00+00:00",
                    "duration": 5100,
                    "interruptionCount": 0,
                }
            ]
        )
        zoom_urls = []

        class FakeEduHub:
            url = "http://fake"

            def __init__(self):
                self.inserts = []

            def get_finished_sessions_without_attendance_check(self):
                return [session]

            def get_course_participants_from_session_id(self, _sid):
                raise AssertionError("program sessions must not use the course participant query")

            def get_program_participants_from_session_id(self, sid):
                assert sid == 21
                return participants_df

            def replace_session_attendances(self, sid, rows, records):
                self.inserts.extend(dict(row) for row in rows)

        class FakeZoom:
            def get_session_attendance(self, url, session_start=None, session_end=None):
                zoom_urls.append(url)
                return zoom_df.copy()

        fake_eduhub = FakeEduHub()
        monkeypatch.setattr(mod, "EduHubClient", lambda: fake_eduhub)
        monkeypatch.setattr(mod, "ZoomClient", lambda: FakeZoom())

        assert mod.check_attendance({})["success"] is True
        assert zoom_urls == ["https://zoom.us/j/9"]
        assert [(r["userId"], r["status"]) for r in fake_eduhub.inserts] == [("u-alice", "ATTENDED")]


class TestOfflineAttendance:
    def test_only_submitted_check_ins_inside_the_window_in_berlin_time(self, monkeypatch):
        """LimeSurvey stores Berlin local time. For a 16:00-17:45 session
        (Berlin) a check-in at 15:52 belongs to it, one at 19:34 does not,
        and an opened but unsubmitted response is dropped."""
        from pythonFunctions import check_attendance as mod
        from api_clients.limesurvey_client import LimeSurveyClient

        answers = pd.DataFrame(
            [
                {"datestamp": "2026-11-03 15:52:01", "submitdate": "2026-11-03 15:52:01", "N1": "Ian", "N2": "Christ", "Place": "SK "},
                {"datestamp": "2026-11-03 17:58:06", "submitdate": "2026-11-03 17:58:06", "N1": "Annika", "N2": "Boock", "Place": "SK"},
                {"datestamp": "2026-11-03 19:34:48", "submitdate": "2026-11-03 19:34:48", "N1": "Jan", "N2": "Winkel", "Place": "SK"},
                {"datestamp": "2026-11-03 16:30:00", "submitdate": None, "N1": None, "N2": None, "Place": "SK"},
                {"datestamp": "2026-11-03 15:20:00", "submitdate": "2026-11-03 15:20:00", "N1": "Too", "N2": "Early", "Place": "SK"},
            ]
        )

        class FakeLimeSurvey(LimeSurveyClient):
            def __init__(self, sid):
                pass

            def get_session_key(self):
                return "key"

            def get_responses(self):
                return answers.copy()

        monkeypatch.setattr(mod, "LimeSurveyClient", FakeLimeSurvey)
        session = {
            "startDateTime": pd.Timestamp("2026-11-03T16:00:00+01:00"),
            "endDateTime": pd.Timestamp("2026-11-03T17:45:00+01:00"),
        }
        records = mod.get_offline_session_attendance(session)
        assert list(records["name"]) == ["Ian Christ", "Annika Boock"]
        assert list(records["location"]) == ["SK", "SK"]
        assert records["joinDateTime"].iloc[0] == pd.Timestamp("2026-11-03T15:52:01+01:00")

    def test_records_serialise_for_session_attendance_data(self):
        """Mixed Zoom (string) and LimeSurvey (timestamp) times must survive
        Session.attendanceData's to_json()."""
        import json

        records = pd.DataFrame(
            [
                {"name": "A", "joinDateTime": "2026-01-01T10:00:00+00:00", "source": "ZOOM"},
                {"name": "B", "joinDateTime": pd.Timestamp("2026-01-01T10:05:00+01:00"), "source": "LIMESURVEY"},
            ]
        )
        parsed = json.loads(records.to_json())
        assert set(parsed["joinDateTime"].keys()) == {"0", "1"}


class TestFinalizingSessions:
    def _on_site_session(self, end):
        return {
            "id": 30,
            "title": "On site",
            "startDateTime": end - pd.Timedelta(hours=2),
            "endDateTime": end,
            "Course": {"CourseLocations": [{"locationOption": "KIEL", "defaultSessionAddress": None}]},
            "SessionAddresses": [],
        }

    def test_on_site_session_waits_for_the_check_in_window(self):
        from pythonFunctions.check_attendance import check_in_window_closed

        end = pd.Timestamp("2026-11-03T17:45:00+01:00")
        session = self._on_site_session(end)
        assert not check_in_window_closed(session, now=end + pd.Timedelta(minutes=10))
        assert check_in_window_closed(session, now=end + pd.Timedelta(minutes=31))
        online = {**session, "Course": {"CourseLocations": [{"locationOption": "ONLINE", "defaultSessionAddress": "x"}]}}
        assert check_in_window_closed(online, now=end + pd.Timedelta(minutes=1))

    def test_failed_write_leaves_session_unchecked(self, monkeypatch):
        """If storing fails, attendanceData is not set, so the cron retries."""
        from pythonFunctions import check_attendance as mod

        session = self._on_site_session(pd.Timestamp("2026-01-01T11:30:00Z"))

        class FakeEduHub:
            url = "http://fake"

            def get_finished_sessions_without_attendance_check(self):
                return [session]

            def get_course_participants_from_session_id(self, _sid):
                return pd.DataFrame([{"id": "u-bob", "firstName": "Bob", "lastName": "Builder", "email": "b@example.com"}])

            def replace_session_attendances(self, sid, rows, records):
                raise ValueError("replace_session_attendances failed: constraint violation")

        monkeypatch.setattr(mod, "EduHubClient", lambda: FakeEduHub())
        monkeypatch.setattr(mod, "ZoomClient", lambda: None)
        monkeypatch.setattr(
            mod, "get_offline_session_attendance",
            lambda s, options=None: pd.DataFrame([{"name": "Bob Builder", "location": "SK"}]),
        )
        assert mod.check_attendance({})["success"] is True


class TestCheckInLocations:
    def test_check_ins_from_other_locations_are_dropped(self, monkeypatch):
        """A HEIDE-only session ignores Kiel check-ins but keeps Heide and unmapped codes."""
        from pythonFunctions import check_attendance as mod
        from api_clients.limesurvey_client import LimeSurveyClient

        answers = pd.DataFrame(
            [
                {"datestamp": "2026-11-03 16:05:00", "submitdate": "2026-11-03 16:05:00", "N1": "Kiel", "N2": "Person", "Place": "SK"},
                {"datestamp": "2026-11-03 16:06:00", "submitdate": "2026-11-03 16:06:00", "N1": "Heide", "N2": "Person", "Place": "H04"},
                {"datestamp": "2026-11-03 16:07:00", "submitdate": "2026-11-03 16:07:00", "N1": "Unknown", "N2": "Code", "Place": "XYZ"},
            ]
        )

        class FakeLimeSurvey(LimeSurveyClient):
            def __init__(self, sid):
                pass

            def get_session_key(self):
                return "key"

            def get_responses(self):
                return answers.copy()

        monkeypatch.setattr(mod, "LimeSurveyClient", FakeLimeSurvey)
        session = {
            "startDateTime": pd.Timestamp("2026-11-03T16:00:00+01:00"),
            "endDateTime": pd.Timestamp("2026-11-03T17:45:00+01:00"),
        }
        records = mod.get_offline_session_attendance(session, ["HEIDE"])
        assert list(records["name"]) == ["Heide Person", "Unknown Code"]

    def test_check_in_in_the_repeated_clock_change_hour_is_kept(self):
        from api_clients.limesurvey_client import LimeSurveyClient

        client = LimeSurveyClient.__new__(LimeSurveyClient)
        times = client.to_datetime(pd.Series(["2026-10-25 02:30:00", "2026-10-25 12:00:00"]))
        assert not times.isna().any()
        assert times.iloc[0] == pd.Timestamp("2026-10-25T02:30:00+02:00")


def test_hamburg_sessions_collect_check_ins(monkeypatch):
    from pythonFunctions import check_attendance as mod

    session = {
        "id": 40,
        "title": "Hamburg",
        "startDateTime": pd.Timestamp("2026-01-01T10:00:00Z"),
        "endDateTime": pd.Timestamp("2026-01-01T11:30:00Z"),
        "Course": {"CourseLocations": [{"locationOption": "HAMBURG", "defaultSessionAddress": None}]},
        "SessionAddresses": [],
    }
    fetched = []

    def _fetch(s, options=None):
        fetched.append(options)
        return pd.DataFrame([{"name": "Bob Builder", "location": "HH"}])

    monkeypatch.setattr(mod, "get_offline_session_attendance", _fetch)
    records, reason = mod.collect_attendance_records(session, None)
    assert reason is None
    assert fetched == [["HAMBURG"]]
    assert list(records["name"]) == ["Bob Builder"]
