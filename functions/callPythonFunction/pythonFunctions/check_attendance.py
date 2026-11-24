import os
import re
import logging
import unicodedata
import pandas as pd
from thefuzz import fuzz
from api_clients import EduHubClient, ZoomClient, LimeSurveyClient
from api_clients.zoom_client import ZoomAttendanceError, ZoomClient as _Zoom, count_interruptions
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

# In-memory only: the occupied (start, end) spans of a Zoom record, used to
# combine records of the same person. Not stored in Session.attendanceData.
INTERVALS = "intervals"


def stored_records(records):
    """The records as stored in Session.attendanceData."""
    return records.reindex(columns=RECORD_COLUMNS)


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
                eduhub_client.replace_session_attendances(
                    session["id"], attendance_rows, stored_records(records)
                )
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


def _meeting_link(row):
    return ((row.get("OnlineMeetingLink") or {}).get("url") or "").strip() or None


def session_locations(session):
    """Where a session takes place, as {locationOption, defaultSessionAddress}.

    Course sessions use their course's locations, with an ONLINE session's own
    link taking precedence over the course default. Program sessions have no
    course, so each SessionAddress carries its own location option and address
    directly. For ONLINE the address is the meeting link, which lives in
    OnlineMeetingLink rather than in the public address columns.
    """
    if session.get("programId") is None:
        # A course session's own link wins over its course location's default,
        # the same order the reminder mail and the course page use.
        own_link = next(
            (
                _meeting_link(sa)
                for sa in session.get("SessionAddresses", [])
                if (sa.get("CourseLocation") or {}).get("locationOption") == "ONLINE"
                and _meeting_link(sa)
            ),
            None,
        )
        return [
            {
                "locationOption": cl["locationOption"],
                "defaultSessionAddress": (own_link or _meeting_link(cl))
                if cl["locationOption"] == "ONLINE"
                else cl.get("defaultSessionAddress"),
            }
            for cl in session["Course"]["CourseLocations"]
        ]
    return [
        {
            "locationOption": sa["locationOption"],
            "defaultSessionAddress": _meeting_link(sa)
            if sa["locationOption"] == "ONLINE"
            else (sa.get("LocationAddress") or {}).get("address") or sa.get("address"),
        }
        for sa in session.get("SessionAddresses", [])
        if sa.get("locationOption")
    ]


# Every LocationOption except ONLINE; all use the same check-in survey.
ON_SITE_OPTIONS = ("KIEL", "HEIDE", "HAMBURG")


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
    records = records.reindex(columns=RECORD_COLUMNS + [INTERVALS]).reset_index(drop=True)
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
    ``Hase, Christian`` -> ``hase christian``,
    ``Lisa Brandner (Example Institute)`` -> ``lisa brandner``."""
    text = _clean_text(name).lower().lstrip("@")
    text = text.split(":", 1)[0]
    text = re.sub(r"\([^)]*\)?", " ", text)
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
    # NFC: a decomposed "é" (e + combining accent) would otherwise be split
    # into two tokens by the fuzzy matcher.
    return unicodedata.normalize("NFC", str(value)).strip()


UMLAUTS_WRITTEN_OUT = str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue"})

# Forms in which names are compared: as written, without accents
# (Müller -> muller) and with umlauts written out (Müller -> mueller), so
# Müller, Mueller and Muller all match. A score is the best over the forms.
AS_WRITTEN, WITHOUT_ACCENTS, UMLAUTS_OUT = "as written", "without accents", "umlauts out"
FOLDINGS = (AS_WRITTEN, WITHOUT_ACCENTS, UMLAUTS_OUT)


def _fold(text, folding=WITHOUT_ACCENTS):
    """Lower-case ``text`` in one of the FOLDINGS forms."""
    text = unicodedata.normalize("NFC", _clean_text(text).lower())
    if folding == AS_WRITTEN:
        return text
    text = text.replace("ß", "ss")
    if folding == UMLAUTS_OUT:
        text = text.translate(UMLAUTS_WRITTEN_OUT)
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))


# Score of a record that leaves out some of the participant's names ("Farid
# Khan" for "Omar Farid Ben Khan"): above the threshold, below an exact
# name, so a participant whose name matches exactly keeps priority.
NAME_SUBSET_SCORE = 90


def _pair_score(full_name, candidate):
    """Similarity of two folded names.

    ``ratio`` compares the names as written, so a typo in the first letter
    of a token (Sann/Dann) costs one character; ``token_sort_ratio`` alone
    would sort the tokens differently and fall below 50. ``token_sort_ratio``
    covers swapped order ("Hase Christian").
    """
    if not candidate:
        return 0
    return max(fuzz.ratio(full_name, candidate), fuzz.token_sort_ratio(full_name, candidate))


def _record_name_candidates(record_name, folding=WITHOUT_ACCENTS):
    """The record name as written and as cleaned handle, both folded."""
    raw = _clean_text(record_name)
    if not raw:
        return []
    return [_fold(raw, folding), _fold(clean_display_name(raw), folding)]


def _name_parts(participant, folding=WITHOUT_ACCENTS):
    """(first name tokens, last name tokens), folded."""
    return (
        _fold(participant.get("firstName"), folding).split(),
        _fold(participant.get("lastName"), folding).split(),
    )


def _written_name_score(participant, record_name):
    """Score of the names as written: breaks ties between participants whose
    names only match after folding ("Jorg Muller") and the exact spelling."""
    first, last = _name_parts(participant, AS_WRITTEN)
    return max(
        (_pair_score(" ".join(first + last), c) for c in _record_name_candidates(record_name, AS_WRITTEN)),
        default=0,
    )


def _name_score(participant, record_name):
    best = 0
    for folding in FOLDINGS:
        first, last = _name_parts(participant, folding)
        full_name = " ".join(first + last)
        for candidate in _record_name_candidates(record_name, folding):
            best = max(best, _pair_score(full_name, candidate))
    return best


def _is_name_subset(participant, record_name):
    """True if the record names the participant by some, not all, of their
    names, with at least one first name and one last name: "Farid Khan" for
    "Omar Farid" "Ben Khan". A multiword first name alone ("Mary Jane") is
    no last-name evidence; it is a partial key instead."""
    return any(
        _is_token_subset(*_name_parts(participant, folding), _record_name_candidates(record_name, folding))
        for folding in FOLDINGS
    )


def _is_token_subset(first_tokens, last_tokens, record_candidates):
    full = set(first_tokens) | set(last_tokens)
    for candidate in record_candidates:
        tokens = set(candidate.split())
        if (
            len(tokens) >= 2
            and tokens < full
            and any(
                a != b and a in first_tokens and b in last_tokens
                for a in tokens
                for b in tokens
            )
        ):
            return True
    return False


def _partial_keys_of_participant(participant):
    """Short forms a participant may appear under: the first name (and its
    first part), the last name, the email local part and initial + last
    name."""
    email = _clean_text(participant.get("email")).lower()
    keys = set()
    if "@" in email:
        keys.add(email.split("@", 1)[0])
    for folding in FOLDINGS:
        first_tokens, last_tokens = _name_parts(participant, folding)
        first, last = " ".join(first_tokens), " ".join(last_tokens)
        if first:
            keys.add(first)
            keys.add(first_tokens[0])
        if last:
            keys.add(last)
        if first and last:
            keys.add(first[0] + re.sub(r"[\s-]", "", last))
    return {k for k in keys if len(k) >= MIN_PARTIAL_KEY_LENGTH}


def _partial_keys_of_record(record_name):
    """``Christine`` -> {christine}; ``HLee`` / ``H. Lee`` -> {hlee}."""
    keys = set()
    raw = _clean_text(record_name).lower()
    for folding in FOLDINGS:
        if raw and " " not in raw:
            keys.add(_fold(raw, folding))
        tokens = _fold(clean_display_name(raw), folding).split()
        if len(tokens) == 1:
            keys.add(tokens[0])
        elif len(tokens) == 2 and len(tokens[0]) == 1:
            keys.add(tokens[0] + tokens[1])
        if len(tokens) >= 2:
            # A multiword first name alone ("Mary Jane").
            keys.add(" ".join(tokens))
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


# Strength of a match type; a combined Attendance shows its weakest link.
MATCH_PRIORITY = {MATCH_TYPE_EMAIL: 3, MATCH_TYPE_NAME: 2, MATCH_TYPE_PARTIAL_NAME: 1}


def _combine_zoom_records(records):
    """One Zoom stay from several records of the same person (renamed, phone
    dial-in, second device). Minutes add up, but time on two devices at
    once counts only once; a gap between records interrupts the stay unless
    it is a breakout-room move."""
    if len(records) == 1:
        return records[0]
    intervals = [r.get(INTERVALS) for r in records]
    if all(isinstance(i, (list, tuple)) and len(i) > 0 for i in intervals):
        # Exact: the union of the time each record was actually present.
        merged = _Zoom._merge_intervals(
            [(pd.Timestamp(s), pd.Timestamp(e)) for spans in intervals for s, e in spans]
        )
        return {
            **records[0],
            "joinDateTime": merged[0][0],
            "leaveDateTime": merged[-1][1],
            "duration": sum((e - s).total_seconds() for s, e in merged),
            "interruptionCount": count_interruptions(merged),
        }

    # Stored records keep only their outer span: approximate.
    spans = []
    for record in records:
        join, leave = record.get("joinDateTime"), record.get("leaveDateTime")
        if join is not None and leave is not None and not pd.isna(join) and not pd.isna(leave):
            spans.append((pd.Timestamp(join), pd.Timestamp(leave)))
    merged = _Zoom._merge_intervals(spans)
    known = [float(r.get("duration")) for r in records
             if r.get("duration") is not None and not pd.isna(r.get("duration"))]
    duration = sum(known) if known else None
    if duration is not None and len(spans) == len(records):
        duration = min(duration, sum((e - s).total_seconds() for s, e in merged))
    interruptions = sum(
        int(r.get("interruptionCount")) for r in records
        if r.get("interruptionCount") is not None and not pd.isna(r.get("interruptionCount"))
    )
    return {
        **records[0],
        "joinDateTime": merged[0][0] if merged else records[0].get("joinDateTime"),
        "leaveDateTime": merged[-1][1] if merged else records[0].get("leaveDateTime"),
        "duration": duration,
        "interruptionCount": interruptions + count_interruptions(merged),
    }


def match_participants(participants, records, session):
    """Match every participant against the session's Attendance Records and
    return one Attendance row (dict) per participant.

    Matching order: exact email, name (fuzzy score >= NAME_MATCH_THRESHOLD,
    also against cleaned handles, or some of the participant's names when
    they fit no one else), then a partial name (single first or last name,
    email local part or initial + last name) that fits exactly one
    participant. Each record goes to at most one participant (best match
    first) and a participant takes one record per source. Further Zoom
    records that match only that participant are added to its Zoom stay
    (renamed for breakout rooms, phone dial-in). A check-in wins over a Zoom
    stay; a Zoom stay below the Minimum Attendance Time is MISSED but keeps
    its match details. Unmatched participants get the closest candidate per
    Attendance Location.
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

    # Participants each record names by a subset of their names; usable only if unique.
    subset_owners = [
        {p_idx for p_idx, participant in enumerate(participant_rows)
         if _is_name_subset(participant, record.get("name"))}
        for record in record_rows
    ]

    scores = [[0] * len(record_rows) for _ in participant_rows]
    # (priority, score, participant index, record index, match type, as-written score)
    candidates = []
    for p_idx, participant in enumerate(participant_rows):
        email = _clean_text(participant.get("email")).lower()
        for r_idx, record in enumerate(record_rows):
            score = _name_score(participant, record.get("name"))
            if subset_owners[r_idx] == {p_idx}:
                score = max(score, NAME_SUBSET_SCORE)
            scores[p_idx][r_idx] = score
            if email and _clean_text(record.get("email")).lower() == email:
                candidates.append((3, 100, p_idx, r_idx, MATCH_TYPE_EMAIL, 100))
            elif score >= NAME_MATCH_THRESHOLD:
                written = _written_name_score(participant, record.get("name"))
                candidates.append((2, score, p_idx, r_idx, MATCH_TYPE_NAME, written))
            elif any(
                owners_by_key.get(key) == {p_idx}
                for key in _partial_keys_of_record(record.get("name"))
            ):
                candidates.append((1, score, p_idx, r_idx, MATCH_TYPE_PARTIAL_NAME, score))

    candidates.sort(key=lambda c: (c[0], c[1], c[5]), reverse=True)
    taken_records = set()
    claimed = {}  # participant index -> {source: [(record index, match type, score)]}
    for _priority, score, p_idx, r_idx, match_type, _written in candidates:
        if r_idx in taken_records:
            continue
        source = record_rows[r_idx].get("source")
        claimed_by_source = claimed.setdefault(p_idx, {})
        if source in claimed_by_source:
            continue
        taken_records.add(r_idx)
        claimed_by_source[source] = [(r_idx, match_type, score)]

    # Further Zoom records of a participant: left over, and matching nobody else.
    owners_of_record = {}
    for candidate in candidates:
        owners_of_record.setdefault(candidate[3], []).append(candidate)
    for r_idx, matching in owners_of_record.items():
        if r_idx in taken_records or record_rows[r_idx].get("source") != SOURCE_ZOOM:
            continue
        if len({c[2] for c in matching}) != 1:
            continue
        _priority, score, p_idx, _r, match_type, _written = matching[0]
        record_email = _clean_text(record_rows[r_idx].get("email")).lower()
        if record_email and record_email != _clean_text(participant_rows[p_idx].get("email")).lower():
            continue  # someone else's account
        zoom_claim = claimed.get(p_idx, {}).get(SOURCE_ZOOM)
        if zoom_claim is not None:
            taken_records.add(r_idx)
            zoom_claim.append((r_idx, match_type, score))

    result = []
    for p_idx, participant in enumerate(participant_rows):
        # One (records, merged record) entry per source.
        stays = []
        for claim in claimed.get(p_idx, {}).values():
            claim.sort(key=lambda m: _sort_time(record_rows[m[0]].get("joinDateTime")))
            parts = [record_rows[m[0]] for m in claim]
            stays.append((claim, _combine_zoom_records(parts) if len(parts) > 1 else parts[0]))
        counting = [stay for stay in stays if _counts_as_attended(stay[1], session_seconds)]
        if counting:
            # On site wins over online when both count.
            counting.sort(key=lambda stay: stay[1].get("source") == SOURCE_ZOOM)
            chosen, status = counting[0], "ATTENDED"
        elif stays:
            chosen, status = stays[0], "MISSED"
        else:
            chosen, status = None, "MISSED"

        if chosen is not None:
            claim, record = chosen
            weakest = min(claim, key=lambda m: (MATCH_PRIORITY[m[1]], m[2]))
            match_type = weakest[1]
            name_scores = [int(m[2]) for m in claim if m[1] != MATCH_TYPE_EMAIL]
            result.append(
                {
                    "userId": participant["id"],
                    "sessionId": session_id,
                    "interruptionCount": _optional_int(record.get("interruptionCount")),
                    "duration": _optional_int(record.get("duration")),
                    "joinDateTime": _format_datetime(record.get("joinDateTime")),
                    "leaveDateTime": _format_datetime(record.get("leaveDateTime")),
                    "status": status,
                    "recordedIdentifier": " + ".join(
                        filter(None, (_recorded_identifier(record_rows[m[0]]) for m in claim))
                    ) or None,
                    "matchType": match_type,
                    "matchScore": min(name_scores) if name_scores else None,
                    "attendanceRecordIndexes": sorted(m[0] for m in claim),
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
                "attendanceRecordIndexes": None,
                "closestCandidates": [
                    {k: c[k] for k in ("location", "identifier", "score")} for c in closest
                ]
                or None,
                "source": closest[0]["source"] if closest else None,
                "location": None,
            }
        )

    return result


def _sort_time(value):
    """Join time for ordering records; records without one come last."""
    if value is None or pd.isna(value):
        return pd.Timestamp.max.tz_localize("UTC")
    ts = pd.Timestamp(value)
    return ts if ts.tzinfo else ts.tz_localize("UTC")
