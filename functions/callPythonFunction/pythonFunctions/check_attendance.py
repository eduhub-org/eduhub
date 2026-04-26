import os
import logging
import pandas as pd
from thefuzz import fuzz
from api_clients import EduHubClient, ZoomClient, LimeSurveyClient
from api_clients.zoom_client import ZoomAttendanceError


# Match types persisted to Attendance.matchType. Keep in sync with the
# comment on the column in the migration that introduced it.
MATCH_TYPE_EMAIL = "EMAIL"
MATCH_TYPE_NAME = "NAME"
MATCH_TYPE_NONE = "NONE"

# Fuzzy name match threshold; below this score the row is treated as MISSED.
NAME_MATCH_THRESHOLD = 80

# Env vars required to talk to the Zoom API. When any of these is missing
# we skip ONLINE attendance collection but still process LimeSurvey /
# offline attendances so the cron run remains useful in environments
# where Zoom is not configured (e.g. local dev, test instances).
ZOOM_REQUIRED_ENV_VARS = ("ZOOM_API_KEY", "ZOOM_API_SECRET", "ZOOM_ACCOUNT_ID")


def _zoom_credentials_configured():
    """Return True iff all Zoom env vars are set to a non-empty value."""
    return all(
        os.getenv(name) not in (None, "") for name in ZOOM_REQUIRED_ENV_VARS
    )


def _init_zoom_client():
    """Instantiate a ``ZoomClient`` if credentials are configured.

    Returns ``None`` when credentials are missing or initialisation fails
    (e.g. Zoom rejects the OAuth request). The caller is expected to fall
    back to offline-only attendance collection in that case and to log a
    clear message explaining why ONLINE attendances are not collected.
    """
    if not _zoom_credentials_configured():
        missing = [n for n in ZOOM_REQUIRED_ENV_VARS if not os.getenv(n)]
        logging.warning(
            "Zoom API credentials not configured (missing: %s). "
            "ONLINE attendances will NOT be collected in this run. "
            "LimeSurvey / offline attendances will still be collected.",
            ", ".join(missing),
        )
        return None
    try:
        return ZoomClient()
    except Exception as exc:
        logging.error(
            "Failed to initialise Zoom client: %s. "
            "ONLINE attendances will NOT be collected in this run. "
            "LimeSurvey / offline attendances will still be collected.",
            exc,
        )
        return None


def check_attendance(arguments):
    """For all sessions for which the attendance hasn't been checked yet
    (no attendance data stored in the session table), gets the participations
    from Zoom and Limesurvey and adds the individual attendances to the
    attandance table (for each registered and correctly identified person)
    and the Session table (a JSON including all recorded participants of the
    session).

    Args:
        hasura_secret (str): Secret to authenticate the user
        arguments (dict): Payload potentially containing function parameters (in this case none)

    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (list, optional): List of processed sessions
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Check Attendance Function ##########")
    logging.debug("arguments:", arguments)

    try:
        eduhub_client = EduHubClient()
        logging.debug(f"eduhub_client.url:  {eduhub_client.url}")
        sessions = eduhub_client.get_finished_sessions_without_attendance_check()

        if len(sessions) == 0:
            logging.info("No finished sessions without attendance check found")
            return {
                "success": True,
                "data": [],
                "message": "No finished sessions without attendance check found"
            }

        logging.info(
            "########## Finished Sessions without Attendance Check:\n%s", sessions
        )

        with pd.option_context(
            "display.max_rows", None, "display.max_columns", None, "display.width", None
        ):
            logging.debug("########## Full DataFrame:\n%s", sessions)

        zoom_client = _init_zoom_client()

        for session in sessions:
            logging.info(
                f"########## Checking session {session['title']} from {session['startDateTime']} to {session['endDateTime']}"
            )

            attendance_data = pd.DataFrame()
            # Flip to True as soon as any source for this session fails to
            # return complete data. We then skip the Attendance inserts and
            # the Session.attendanceData write entirely so the session
            # remains eligible for retry on the next cron run.
            attendance_incomplete = False
            incomplete_reason = None

            for location in session["Course"]["CourseLocations"]:
                logging.info("### Getting attendances for %s", location["locationOption"])

                if location["locationOption"] == "ONLINE":
                    if zoom_client is None:
                        # Zoom not configured / unreachable this run.
                        # Skip ONLINE collection for this session but keep
                        # processing other (offline) locations so their
                        # attendances are still recorded.
                        logging.warning(
                            "Skipping ONLINE attendance collection for "
                            "session %s (id=%s): Zoom client unavailable. "
                            "Offline attendances for this session (if any) "
                            "will still be collected.",
                            session.get("title"),
                            session.get("id"),
                        )
                        continue
                    try:
                        # Pass the session window so the Zoom client can pick
                        # only the occurrences that actually ran for this
                        # session (not stray reconnects after class).
                        zoom_attendance = zoom_client.get_session_attendance(
                            location["defaultSessionAddress"],
                            session_start=session["startDateTime"],
                            session_end=session["endDateTime"],
                        )
                        logging.debug(
                            f"############# Zoom Attendance Data\n{zoom_attendance}"
                        )
                        if zoom_attendance is None or len(zoom_attendance) == 0:
                            logging.info(
                                "No Zoom participants recorded for session %s",
                                session.get("title"),
                            )
                            continue
                        zoom_attendance["source"] = "ZOOM"
                        zoom_attendance["location"] = "ZOOM"
                        attendance_data = pd.concat([attendance_data, zoom_attendance])
                    except ZoomAttendanceError as exc:
                        # Partial Zoom data => aggregated totals would be
                        # wrong for affected participants. Leave the session
                        # unmarked so the next cron run can retry.
                        logging.error(
                            "Zoom attendance incomplete for session %s "
                            "(meeting %s, failed instances %s): %s",
                            session.get("title"),
                            exc.meeting_id,
                            exc.failed_uuids,
                            exc,
                        )
                        attendance_incomplete = True
                        incomplete_reason = str(exc)
                    except Exception as e:
                        logging.error(
                            "Error while getting Zoom attendance for session %s: %s",
                            session.get("title"),
                            e,
                        )
                        attendance_incomplete = True
                        incomplete_reason = str(e)

                elif location["locationOption"] in ["KIEL", "HEIDE"]:
                    logging.info("Getting offline attendances from LimeSurvey")
                    offline_attendance = get_offline_session_attendance(session, location)
                    offline_attendance["source"] = "LIMESURVEY"
                    logging.debug(
                        f"############# Offline Attendance Data\n{offline_attendance}"
                    )
                    attendance_data = pd.concat([attendance_data, offline_attendance])

            logging.debug(f"############# Attendance Data\n{attendance_data}")

            attendance_data.reset_index(drop=True, inplace=True)
            logging.debug(f"############# Attendance Data\n{attendance_data}")

            if attendance_incomplete:
                # Leave Session.attendanceData NULL and skip Attendance
                # inserts so the daily cron picks this session up again
                # next time (the Hasura query filters on
                # attendanceData IS NULL).
                logging.warning(
                    "Skipping attendance writes for session %s (id=%s): %s. "
                    "Session remains eligible for retry on next cron run.",
                    session.get("title"),
                    session.get("id"),
                    incomplete_reason,
                )
                continue

            course_participants = eduhub_client.get_course_participants_from_session_id(
                session["id"]
            )
            logging.info(
                "########## Checking attendances for the %s confirmed participants in the session's course",
                len(course_participants),
            )
            pd.options.mode.chained_assignment = None  # default='warn'

            for p in range(len(course_participants)):
                try:
                    participant_row = course_participants.iloc[p, :]
                    logging.debug(
                        f"############# Preparation of attendance data for participant {participant_row['firstName']} {participant_row['lastName']}"
                    )
                    course_participant_attendance = prepare_participant_attendance_data(
                        participant_row, attendance_data, session["id"]
                    )
                    logging.debug(
                        f"############# Course Participant Attendance\n{course_participant_attendance}"
                    )
                    eduhub_client.insert_attendance(course_participant_attendance)
                    logging.info(
                        "### %s: %s via %s [%s: %s to %s; recorded identifier: %s]",
                        participant_row["email"],
                        course_participant_attendance["status"][0],
                        course_participant_attendance["matchType"][0],
                        course_participant_attendance["source"][0],
                        course_participant_attendance["joinDateTime"][0],
                        course_participant_attendance["leaveDateTime"][0],
                        course_participant_attendance["recordedIdentifier"][0],
                    )
                except Exception as e:
                    logging.error(
                        f"Error while preparing attendance data for participant {course_participants.iloc[p, :]['firstName']} {course_participants.iloc[p, :]['lastName']}: {e}"
                    )
            eduhub_client.update_session_attendanceData(attendance_data, session["id"])
            logging.info("Attendance data updated for session %s", session["title"])

        return {
            "success": True,
            "data": sessions,
            "message": f"Successfully processed {len(sessions)} sessions"
        }

    except Exception as e:
        logging.error(f"Error checking attendance: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


#############################################################################################
# Helper functions


def get_offline_session_attendance(session, location):
    """Retrieves the attendance registration from LimeSurvey, filters them to those relevant for the
    indicated session, and brings them into the needed format"""
    if session.get("startDateTime") is None or session.get("endDateTime") is None:
        return "Error: Attendances cannot be checked since start or end time of the meeting was not provided"
    else:
        limesurvey_client = LimeSurveyClient(sid=os.getenv("LMS_ATTENDANCE_SURVEY_ID"))
        logging.debug(
            "############# LMS_ATTENDANCE_SURVEY_ID:\n%s",
            os.getenv("LMS_ATTENDANCE_SURVEY_ID"),
        )
        limesurvey_client.set_key(limesurvey_client.get_session_key())
        survey_answers = limesurvey_client.get_responses()
        logging.debug("############# Survey Answers\n%s", survey_answers)
        survey_answers.rename(
            columns={
                "datestamp": "joinDateTime",
                "N1": "firstName",
                "N2": "lastName",
                "Place": "location",
            },
            inplace=True,
        )
        survey_answers["name"] = (
            survey_answers["firstName"] + " " + survey_answers["lastName"]
        )
        survey_answers["joinDateTime"] = limesurvey_client.to_datetime(
            survey_answers["joinDateTime"]
        )
        logging.debug("############# Survey Answers\n%s", survey_answers)
        session_attendances = survey_answers[
            (survey_answers["joinDateTime"] >= (session["startDateTime"]))
        ].copy()
        logging.debug("############# Session Attendances\n%s", session_attendances)

        # NOTE: We intentionally do not filter LimeSurvey responses by
        # ``location`` (the raw Place value) here. The Place answer codes
        # configured in LimeSurvey don't line up cleanly with
        # LocationOption, and an overly strict filter was silently
        # dropping every offline response. The raw Place value is still
        # persisted on each Attendance row (via the ``location`` column
        # below) so downstream consumers (e.g. update_enrollment_locations)
        # can interpret it.
        session_attendances["location"] = (
            session_attendances["location"].astype(str).str.strip()
        )

        session_attendances["interruptionCount"] = None
        session_attendances["duration"] = None
        session_attendances["leaveDateTime"] = None
        # LimeSurvey answers have no email; callers use name-matching only.
        if "email" not in session_attendances.columns:
            session_attendances["email"] = None

        return session_attendances


def _missed_attendance_row(user_id, session_id):
    """Construct a MISSED attendance row for a participant when no source
    attendance data exists at all for the session."""
    return pd.DataFrame(
        [
            {
                "userId": user_id,
                "sessionId": int(session_id),
                "interruptionCount": None,
                "duration": None,
                "joinDateTime": None,
                "leaveDateTime": None,
                "score": None,
                "status": "MISSED",
                "recordedIdentifier": None,
                "matchType": MATCH_TYPE_NONE,
                "source": None,
                "location": None,
            }
        ]
    )


def _recorded_identifier(row):
    """Prefer the matched row's email over its display name so admins have
    a durable identifier; fall back to None if neither is present."""
    email = row.get("email")
    if email is not None and str(email).strip() != "" and not pd.isna(email):
        return str(email).strip().lower()
    name = row.get("name")
    if name is not None and not pd.isna(name):
        name_str = str(name).strip()
        if name_str:
            return name_str
    return None


def _format_datetime(value):
    if value is None or pd.isna(value):
        return None
    return str(value)


def prepare_participant_attendance_data(participant, attendance_data, session_id):
    """Match an enrolled participant against the aggregated source attendance
    data. Tries an exact email match first and falls back to fuzzy name
    matching. The resulting row always carries an explicit ``matchType``.
    """
    logging.debug("############# Participant\n%s", participant)
    participant_full_name = f"{participant['firstName']} {participant['lastName']}"

    if len(attendance_data) == 0:
        return _missed_attendance_row(participant["id"], session_id)

    working = attendance_data.copy()
    working.reset_index(drop=True, inplace=True)

    matched_row = None
    match_type = None
    status = "MISSED"

    # -- 1. Email match ------------------------------------------------
    participant_email = participant.get("email")
    if (
        participant_email is not None
        and str(participant_email).strip() != ""
        and "email" in working.columns
    ):
        participant_email_key = str(participant_email).strip().lower()
        email_column = working["email"].fillna("").astype(str).str.strip().str.lower()
        email_matches = working[email_column == participant_email_key]
        if len(email_matches) > 0:
            matched_row = email_matches.iloc[0]
            match_type = MATCH_TYPE_EMAIL
            status = "ATTENDED"

    # -- 2. Fuzzy name fallback ---------------------------------------
    if matched_row is None:
        working["score"] = [
            fuzz.token_sort_ratio(
                participant_full_name.lower(),
                "" if name is None or pd.isna(name) else str(name).lower(),
            )
            for name in working["name"]
        ]
        logging.debug("############# Attendance Data with scores\n%s", working)
        best_idx = working["score"].idxmax()
        best_row = working.iloc[best_idx]
        if best_row["score"] >= NAME_MATCH_THRESHOLD:
            matched_row = best_row
            match_type = MATCH_TYPE_NAME
            status = "ATTENDED"
        else:
            # Keep the best candidate around so admins can see the closest
            # miss, but record it as NO match.
            matched_row = best_row
            match_type = MATCH_TYPE_NONE
            status = "MISSED"

    interruption_count = matched_row.get("interruptionCount")
    if interruption_count is not None and not pd.isna(interruption_count):
        interruption_count = int(interruption_count)
    else:
        interruption_count = None

    duration = matched_row.get("duration")
    if duration is not None and not pd.isna(duration):
        duration = int(duration)
    else:
        duration = None

    row = {
        "userId": participant["id"],
        "sessionId": int(session_id),
        "interruptionCount": interruption_count,
        "duration": duration,
        "joinDateTime": _format_datetime(matched_row.get("joinDateTime")),
        "leaveDateTime": _format_datetime(matched_row.get("leaveDateTime")),
        "score": None
        if matched_row.get("score") is None or pd.isna(matched_row.get("score"))
        else int(matched_row["score"])
        if match_type != MATCH_TYPE_EMAIL
        else None,
        "status": status,
        "recordedIdentifier": _recorded_identifier(matched_row),
        "matchType": match_type,
        "source": matched_row.get("source"),
        "location": matched_row.get("location"),
    }

    return pd.DataFrame([row])
