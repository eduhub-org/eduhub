import os
import re
import logging
import pandas as pd
from thefuzz import fuzz
from api_clients import EduHubClient, ZoomClient, LimeSurveyClient
from api_clients.zoom_client import ZoomAttendanceError
from pythonFunctions.limesurvey_location_mapping import LIMESURVEY_LOCATION_MAPPING


# Match types persisted to Attendance.matchType. Keep in sync with the
# comment on the column in the migration that introduced it.
MATCH_TYPE_EMAIL = "EMAIL"
MATCH_TYPE_NAME = "NAME"
MATCH_TYPE_PARTIAL_NAME = "PARTIAL_NAME"
MATCH_TYPE_NONE = "NONE"

# Fuzzy name match threshold; below this score the row is treated as MISSED.
NAME_MATCH_THRESHOLD = 80

# Minimum Attendance Time: share of the Session someone must spend in the
# online meeting. A check-in on site counts regardless of time.
MIN_ATTENDANCE_SHARE = 0.5

# Check-in Window: LimeSurvey check-ins this long before the start or after
# the end of a Session still belong to it.
CHECK_IN_WINDOW = pd.Timedelta(minutes=30)

# Partial-name keys shorter than this ("jd") are too ambiguous to match on.
MIN_PARTIAL_KEY_LENGTH = 3

SOURCE_ZOOM = "ZOOM"
SOURCE_LIMESURVEY = "LIMESURVEY"

# Columns of an Attendance Record as stored in Session.attendanceData.
RECORD_COLUMNS = [
    "name",
    "email",
    "joinDateTime",
    "leaveDateTime",
    "duration",
    "interruptionCount",
    "source",
    "location",
]

# Env vars required to talk to the Zoom API.
ZOOM_REQUIRED_ENV_VARS = ("ZOOM_API_KEY", "ZOOM_API_SECRET", "ZOOM_ACCOUNT_ID")


def _zoom_credentials_configured():
    """Return True iff all Zoom env vars are set to a non-empty value."""
    return all(
        os.getenv(name) not in (None, "") for name in ZOOM_REQUIRED_ENV_VARS
    )


def _init_zoom_client():
    """Instantiate a ``ZoomClient`` if credentials are configured.

    Returns ``None`` when credentials are missing or initialisation fails
    (e.g. Zoom rejects the OAuth request). Sessions that need Zoom are then
    left unchecked and retried on the next run.
    """
    if not _zoom_credentials_configured():
        missing = [n for n in ZOOM_REQUIRED_ENV_VARS if not os.getenv(n)]
        logging.warning(
            "Zoom API credentials not configured (missing: %s). "
            "Sessions with an ONLINE location will NOT be checked in this run.",
            ", ".join(missing),
        )
        return None
    try:
        return ZoomClient()
    except Exception as exc:
        logging.error(
            "Failed to initialise Zoom client: %s. "
            "Sessions with an ONLINE location will NOT be checked in this run.",
            exc,
        )
        return None


def check_attendance(arguments):
    """For all sessions for which the attendance hasn't been checked yet
    (no attendance data stored in the session table), gets the Attendance
    Records from Zoom and LimeSurvey, matches them to the session's
    participants and stores one Attendance per participant plus the records
    themselves (Session.attendanceData).

    A session whose sources could not all be read is left unchecked so the
    next cron run retries it; its participants never get a wrong MISSED.

    Args:
        arguments (dict): Payload potentially containing function parameters (in this case none)

    Returns:
        dict: Response containing:
            - success (bool): Whether the operation was successful
            - data (list, optional): List of processed sessions
            - error (str, optional): Error message if operation failed
    """
    logging.info("########## Check Attendance Function ##########")
    logging.debug("arguments: %s", arguments)

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

        zoom_client = _init_zoom_client()

        for session in sessions:
            logging.info(
                f"########## Checking session {session['title']} from {session['startDateTime']} to {session['endDateTime']}"
            )

            if not check_in_window_closed(session):
                # Check-ins are accepted until CHECK_IN_WINDOW after the end;
                # checking earlier would finalize late check-ins as MISSED.
                logging.info(
                    "Check-in window of session %s (id=%s) is still open; checking it on a later run.",
                    session.get("title"),
                    session.get("id"),
                )
                continue

            records, incomplete_reason = collect_attendance_records(session, zoom_client)
            if incomplete_reason is not None:
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

            if session.get("programId") is not None:
                course_participants = eduhub_client.get_program_participants_from_session_id(
                    session["id"]
                )
            else:
                course_participants = eduhub_client.get_course_participants_from_session_id(
                    session["id"]
                )
            logging.info(
                "########## Checking attendances for the %s participants in the session's course",
                len(course_participants),
            )

            attendance_rows = match_participants(course_participants, records, session)
            for row in attendance_rows:
                logging.info(
                    "### %s: %s via %s [%s: %s to %s; recorded identifier: %s]",
                    row["userId"],
                    row["status"],
                    row["matchType"],
                    row["source"],
                    row["joinDateTime"],
                    row["leaveDateTime"],
                    row["recordedIdentifier"],
                )

            # One transaction: a re-check (attendanceData reset to NULL) replaces the
            # automatic Attendances, Manual Attendances stay, and attendanceData is
            # only set when everything was stored, so a failure is retried.
            try:
                eduhub_client.replace_session_attendances(session["id"], attendance_rows, records)
            except Exception as exc:
                logging.error(
                    "Storing the attendances of session %s (id=%s) failed: %s. "
                    "Session remains eligible for retry on next cron run.",
                    session.get("title"),
                    session.get("id"),
                    exc,
                )
                continue
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


def session_locations(session):
    """Where a session takes place, as {locationOption, defaultSessionAddress}.

    Course sessions use their course's locations. Program sessions have no
    course, so each SessionAddress carries its own location option and the
    address (the meeting link for ONLINE) directly.
    """
    if session.get("programId") is None:
        return session["Course"]["CourseLocations"]
    return [
        {
            "locationOption": sa["locationOption"],
            "defaultSessionAddress": (sa.get("LocationAddress") or {}).get("address")
            or sa.get("address"),
        }
        for sa in session.get("SessionAddresses", [])
        if sa.get("locationOption")
    ]


ON_SITE_OPTIONS = ("KIEL", "HEIDE")


def check_in_window_closed(session, now=None):
    """Sessions held on site are checked only once their Check-in Window has
    closed; online-only sessions right after they end."""
    if not any(loc["locationOption"] in ON_SITE_OPTIONS for loc in session_locations(session)):
        return True
    now = now or pd.Timestamp.now(tz="UTC")
    return now >= session["endDateTime"] + CHECK_IN_WINDOW


def collect_attendance_records(session, zoom_client):
    """Gather the session's Attendance Records from every source its
    locations need.

    Returns ``(records, None)`` with one row per record (RECORD_COLUMNS,
    index 0..n-1), or ``(None, reason)`` when a needed source could not be
    read completely.
    """
    frames = []
    survey_fetched = False

    for location in session_locations(session):
        option = location["locationOption"]
        logging.info("### Getting attendances for %s", option)

        if option == "ONLINE":
            if zoom_client is None:
                return None, "Zoom client unavailable"
            try:
                # Pass the session window so the Zoom client can pick only
                # the occurrences that actually ran for this session.
                zoom_attendance = zoom_client.get_session_attendance(
                    location["defaultSessionAddress"],
                    session_start=session["startDateTime"],
                    session_end=session["endDateTime"],
                )
            except ZoomAttendanceError as exc:
                # Partial Zoom data => aggregated totals would be wrong.
                logging.error(
                    "Zoom attendance incomplete for session %s "
                    "(meeting %s, failed instances %s): %s",
                    session.get("title"),
                    exc.meeting_id,
                    exc.failed_uuids,
                    exc,
                )
                return None, str(exc)
            except Exception as exc:
                logging.error(
                    "Error while getting Zoom attendance for session %s: %s",
                    session.get("title"),
                    exc,
                )
                return None, str(exc)
            if zoom_attendance is None or len(zoom_attendance) == 0:
                logging.info(
                    "No Zoom participants recorded for session %s",
                    session.get("title"),
                )
                continue
            zoom_attendance = zoom_attendance.copy()
            zoom_attendance["source"] = SOURCE_ZOOM
            zoom_attendance["location"] = SOURCE_ZOOM
            frames.append(zoom_attendance)

        elif option in ON_SITE_OPTIONS:
            # One check-in survey serves all on-site locations; fetching it
            # per location would duplicate every record.
            if survey_fetched:
                continue
            survey_fetched = True
            try:
                on_site = [
                    loc["locationOption"] for loc in session_locations(session)
                    if loc["locationOption"] in ON_SITE_OPTIONS
                ]
                offline_attendance = get_offline_session_attendance(session, on_site)
            except Exception as exc:
                logging.error(
                    "Error while getting LimeSurvey check-ins for session %s: %s",
                    session.get("title"),
                    exc,
                )
                return None, f"LimeSurvey: {exc}"
            offline_attendance = offline_attendance.copy()
            offline_attendance["source"] = SOURCE_LIMESURVEY
            frames.append(offline_attendance)

    frames = [frame for frame in frames if len(frame) > 0]
    if frames:
        records = pd.concat(frames, ignore_index=True)
    else:
        records = pd.DataFrame(columns=RECORD_COLUMNS)
    records = records.reindex(columns=RECORD_COLUMNS).reset_index(drop=True)
    logging.debug("############# Attendance Records\n%s", records)
    return records, None


def get_offline_session_attendance(session, on_site_options=None):
    """Submitted LimeSurvey check-ins inside the session's Check-in Window,
    as Attendance Records. Raises when LimeSurvey cannot be read.

    With ``on_site_options`` (e.g. ["HEIDE"]), check-ins whose Place maps to
    another location are dropped. Places that map to no location are kept:
    the Place codes are not maintained exhaustively, and dropping unknown
    codes once discarded every check-in."""
    if session.get("startDateTime") is None or session.get("endDateTime") is None:
        raise ValueError("start or end time of the session is missing")

    limesurvey_client = LimeSurveyClient(sid=os.getenv("LMS_ATTENDANCE_SURVEY_ID"))
    limesurvey_client.set_key(limesurvey_client.get_session_key())
    survey_answers = limesurvey_client.get_responses()
    logging.debug("############# Survey Answers\n%s", survey_answers)
    if survey_answers is None or len(survey_answers) == 0:
        return pd.DataFrame(columns=RECORD_COLUMNS)

    # Opened but never submitted responses carry a datestamp but no name.
    submitted = survey_answers[
        survey_answers["submitdate"].notna()
        & (survey_answers["submitdate"].astype(str).str.strip() != "")
    ].copy()

    check_in_time = limesurvey_client.to_datetime(submitted["datestamp"])
    in_window = (check_in_time >= session["startDateTime"] - CHECK_IN_WINDOW) & (
        check_in_time <= session["endDateTime"] + CHECK_IN_WINDOW
    )
    if on_site_options:
        place = submitted["Place"].fillna("").astype(str).str.strip() if "Place" in submitted.columns else ""
        mapped = place.map(LIMESURVEY_LOCATION_MAPPING) if "Place" in submitted.columns else None
        if mapped is not None:
            unmapped = place[mapped.isna() & (place != "")]
            if len(unmapped):
                logging.info("Keeping check-ins with unmapped Place codes: %s", sorted(set(unmapped)))
            in_window &= mapped.isna() | mapped.isin(on_site_options)
    submitted = submitted[in_window]
    check_in_time = check_in_time[in_window]

    def _text(column):
        if column not in submitted.columns:
            return pd.Series("", index=submitted.index)
        return submitted[column].fillna("").astype(str).str.strip()

    # The raw Place value is persisted on each Attendance (``location``) and
    # mapped to a LocationOption downstream.
    return pd.DataFrame(
        {
            "name": (_text("N1") + " " + _text("N2")).str.strip(),
            "email": None,
            "joinDateTime": check_in_time,
            "leaveDateTime": None,
            "duration": None,
            "interruptionCount": None,
            "location": _text("Place"),
        },
        index=submitted.index,
    ).reset_index(drop=True)


def location_option_of_record(record):
    """Attendance Location of a record: ONLINE for Zoom, otherwise the
    LocationOption its raw Place maps to (or the raw Place itself)."""
    if record.get("source") == SOURCE_ZOOM:
        return "ONLINE"
    place = _clean_text(record.get("location"))
    return LIMESURVEY_LOCATION_MAPPING.get(place, place or "UNKNOWN")


def clean_display_name(name):
    """Turn handles into comparable names:
    ``@saikiran.panchireddi.20311a:opencampus.sh`` -> ``saikiran panchireddi``,
    ``Hase, Christian`` -> ``hase christian``."""
    text = _clean_text(name).lower().lstrip("@")
    text = text.split(":", 1)[0]
    text = re.sub(r"[._,]", " ", text)
    return " ".join(t for t in text.split() if not any(c.isdigit() for c in t))


def _clean_text(value):
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    return str(value).strip()


def _name_score(participant_full_name, record_name):
    raw = _clean_text(record_name).lower()
    if not raw:
        return 0
    return max(
        fuzz.token_sort_ratio(participant_full_name, raw),
        fuzz.token_sort_ratio(participant_full_name, clean_display_name(raw)),
    )


def _partial_keys_of_participant(participant):
    """Short forms a participant may appear under: the first name (and its
    first part), the email local part and initial + last name."""
    first = _clean_text(participant.get("firstName")).lower()
    last = _clean_text(participant.get("lastName")).lower()
    email = _clean_text(participant.get("email")).lower()
    keys = set()
    if first:
        keys.add(first)
        keys.add(first.split()[0])
    if "@" in email:
        keys.add(email.split("@", 1)[0])
    if first and last:
        keys.add(first[0] + re.sub(r"[\s-]", "", last))
    return {k for k in keys if len(k) >= MIN_PARTIAL_KEY_LENGTH}


def _partial_keys_of_record(record_name):
    """``Christine`` -> {christine}; ``HLee`` / ``H. Lee`` -> {hlee}."""
    keys = set()
    raw = _clean_text(record_name).lower()
    if raw and " " not in raw:
        keys.add(raw)
    tokens = clean_display_name(raw).split()
    if len(tokens) == 1:
        keys.add(tokens[0])
    elif len(tokens) == 2 and len(tokens[0]) == 1:
        keys.add(tokens[0] + tokens[1])
    return {k for k in keys if len(k) >= MIN_PARTIAL_KEY_LENGTH}


def _counts_as_attended(record, session_seconds):
    """A check-in always counts; a Zoom stay must reach the Minimum
    Attendance Time. An unknown Zoom duration counts (legacy behaviour)."""
    if record.get("source") != SOURCE_ZOOM or not session_seconds:
        return True
    duration = record.get("duration")
    if duration is None or pd.isna(duration):
        return True
    return float(duration) >= MIN_ATTENDANCE_SHARE * session_seconds


def _recorded_identifier(row):
    """Prefer the matched row's email over its display name so admins have
    a durable identifier; fall back to None if neither is present."""
    email = _clean_text(row.get("email"))
    if email:
        return email.lower()
    return _clean_text(row.get("name")) or None


def _format_datetime(value):
    if value is None or pd.isna(value):
        return None
    return str(value)


def _optional_int(value):
    if value is None or pd.isna(value):
        return None
    return int(value)


def match_participants(participants, records, session):
    """Match every participant against the session's Attendance Records and
    return one Attendance row (dict) per participant.

    Matching order: exact email, fuzzy name (>= NAME_MATCH_THRESHOLD, also
    against cleaned handles), then a partial name (single first name, email
    local part or initial + last name) that fits exactly one participant.
    Each record goes to at most one participant (best match first); a
    participant takes at most one record per source. A check-in wins over a
    Zoom stay; a Zoom stay below the Minimum Attendance Time is MISSED but
    keeps its match details. Unmatched participants get the closest
    candidate per Attendance Location.
    """
    session_id = int(session["id"])
    session_seconds = (session["endDateTime"] - session["startDateTime"]).total_seconds()
    participant_rows = [participants.iloc[i] for i in range(len(participants))]
    record_rows = [records.iloc[i] for i in range(len(records))]

    # Which participants each partial key could mean; usable only if unique.
    owners_by_key = {}
    for p_idx, participant in enumerate(participant_rows):
        for key in _partial_keys_of_participant(participant):
            owners_by_key.setdefault(key, set()).add(p_idx)

    scores = [[0] * len(record_rows) for _ in participant_rows]
    candidates = []  # (priority, score, participant index, record index, match type)
    for p_idx, participant in enumerate(participant_rows):
        full_name = f"{_clean_text(participant.get('firstName'))} {_clean_text(participant.get('lastName'))}".strip().lower()
        email = _clean_text(participant.get("email")).lower()
        for r_idx, record in enumerate(record_rows):
            score = _name_score(full_name, record.get("name"))
            scores[p_idx][r_idx] = score
            if email and _clean_text(record.get("email")).lower() == email:
                candidates.append((3, 100, p_idx, r_idx, MATCH_TYPE_EMAIL))
            elif score >= NAME_MATCH_THRESHOLD:
                candidates.append((2, score, p_idx, r_idx, MATCH_TYPE_NAME))
            elif any(
                owners_by_key.get(key) == {p_idx}
                for key in _partial_keys_of_record(record.get("name"))
            ):
                candidates.append((1, score, p_idx, r_idx, MATCH_TYPE_PARTIAL_NAME))

    candidates.sort(key=lambda c: (c[0], c[1]), reverse=True)
    taken_records = set()
    claimed = {}  # participant index -> {source: (record index, match type, score)}
    for _priority, score, p_idx, r_idx, match_type in candidates:
        if r_idx in taken_records:
            continue
        source = record_rows[r_idx].get("source")
        claimed_by_source = claimed.setdefault(p_idx, {})
        if source in claimed_by_source:
            continue
        taken_records.add(r_idx)
        claimed_by_source[source] = (r_idx, match_type, score)

    result = []
    for p_idx, participant in enumerate(participant_rows):
        matches = list(claimed.get(p_idx, {}).values())
        counting = [m for m in matches if _counts_as_attended(record_rows[m[0]], session_seconds)]
        if counting:
            # On site wins over online when both count.
            counting.sort(key=lambda m: record_rows[m[0]].get("source") == SOURCE_ZOOM)
            chosen, status = counting[0], "ATTENDED"
        elif matches:
            chosen, status = matches[0], "MISSED"
        else:
            chosen, status = None, "MISSED"

        if chosen is not None:
            r_idx, match_type, score = chosen
            record = record_rows[r_idx]
            result.append(
                {
                    "userId": participant["id"],
                    "sessionId": session_id,
                    "interruptionCount": _optional_int(record.get("interruptionCount")),
                    "duration": _optional_int(record.get("duration")),
                    "joinDateTime": _format_datetime(record.get("joinDateTime")),
                    "leaveDateTime": _format_datetime(record.get("leaveDateTime")),
                    "status": status,
                    "recordedIdentifier": _recorded_identifier(record),
                    "matchType": match_type,
                    "matchScore": None if match_type == MATCH_TYPE_EMAIL else int(score),
                    "attendanceRecordIndex": r_idx,
                    "closestCandidates": None,
                    "source": record.get("source"),
                    "location": _clean_text(record.get("location")) or None,
                }
            )
            continue

        best_by_location = {}
        for r_idx, record in enumerate(record_rows):
            identifier = _clean_text(record.get("name")) or _clean_text(record.get("email"))
            if not identifier:
                continue
            location = location_option_of_record(record)
            best = best_by_location.get(location)
            if best is None or scores[p_idx][r_idx] > best["score"]:
                best_by_location[location] = {
                    "location": location,
                    "identifier": identifier,
                    "score": int(scores[p_idx][r_idx]),
                    "source": record.get("source"),
                }
        closest = sorted(best_by_location.values(), key=lambda c: -c["score"])
        result.append(
            {
                "userId": participant["id"],
                "sessionId": session_id,
                "interruptionCount": None,
                "duration": None,
                "joinDateTime": None,
                "leaveDateTime": None,
                "status": "MISSED",
                "recordedIdentifier": closest[0]["identifier"] if closest else None,
                "matchType": MATCH_TYPE_NONE,
                "matchScore": None,
                "attendanceRecordIndex": None,
                "closestCandidates": [
                    {k: c[k] for k in ("location", "identifier", "score")} for c in closest
                ]
                or None,
                "source": closest[0]["source"] if closest else None,
                "location": None,
            }
        )

    return result
