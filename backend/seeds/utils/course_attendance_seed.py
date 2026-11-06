"""Sessions, locations and attendances for the realistic seed courses.

Called by ``generate_ml_degree_seed.py``. The block it renders sits at the end
of ``initial_seeds.sql`` because it covers every participant of these courses:
the generated ML degree participants and the hand-written enrollments of the
dev accounts further down the file (read back from the seed file).

Past courses get fixed dates in their semester. Running and upcoming courses
are scheduled relative to the week the database is seeded, so they stay
running/upcoming on every fresh database. Finished sessions are "checked": they
carry Attendance Records (``Session.attendanceData``) and one automatic
Attendance per participant, shaped like the output of ``check_attendance``
(email, fuzzy name and partial-name matches, too-short Zoom stays, unmatched
participants with closest candidates, a few Manual Attendances on top).
"""

from __future__ import annotations

import difflib
import json
import random
import re
import zlib
from dataclasses import dataclass, field

BEGIN_MARKER = "-- BEGIN GENERATED COURSE_ATTENDANCE_SEED"
END_MARKER = "-- END GENERATED COURSE_ATTENDANCE_SEED"

SESSION_SECONDS = 2 * 60 * 60
MIN_ATTENDANCE_SHARE = 0.5
PARTICIPANT_STATUSES = {"CONFIRMED", "REGISTERED", "COMPLETED"}
KIEL_PLACE = "SK"  # LimeSurvey answer code of the Starterkitchen
ADDRESSES = {
    "ONLINE": "https://zoom.us/j/{course_id}000",
    "KIEL": "Starterkitchen, Wall 47-51, 24103 Kiel",
    "HEIDE": "Westküstenhochschule, Fritz-Thiedemann-Ring 20, 25746 Heide",
}
# Records that belong to nobody: shared devices, the room account, strangers.
NOISE_ZOOM_NAMES = ["iPhone", "Samsung SM-A175F", "Starterkitchen Eventraum", "Guest", "Zoom user"]
NOISE_CHECK_IN_NAMES = ["Jan Winkel", "Vivien Friesorger", "Hendrik Danner", "Jeanne Laude"]


@dataclass(frozen=True)
class CourseSchedule:
    course_id: int
    locations: tuple[str, ...]
    session_count: int
    # Past courses: first session date (Berlin). Otherwise None.
    first_date: str | None = None
    # Running/upcoming courses: weekday (0 = Monday) and the week of the first
    # session relative to the seeding week (-6 = six weeks before).
    weekday: int = 0
    first_week: int = 0

    @property
    def relative(self) -> bool:
        return self.first_date is None


COURSE_SCHEDULES = [
    # Past semester (May–July 2024)
    CourseSchedule(7001, ("ONLINE", "KIEL"), 10, first_date="2024-05-07"),
    CourseSchedule(7002, ("ONLINE", "KIEL"), 10, first_date="2024-05-08"),
    CourseSchedule(7008, ("ONLINE",), 8, first_date="2024-05-10"),
    # Winter semester 2024/25
    CourseSchedule(7003, ("ONLINE", "KIEL"), 10, first_date="2024-10-10"),
    CourseSchedule(7004, ("ONLINE", "KIEL"), 10, first_date="2024-10-07"),
    CourseSchedule(7005, ("ONLINE", "KIEL", "HEIDE"), 10, first_date="2024-10-08"),
    CourseSchedule(7006, ("ONLINE",), 10, first_date="2024-10-09"),
    CourseSchedule(7007, ("ONLINE", "KIEL"), 10, first_date="2024-10-10"),
    CourseSchedule(7012, ("KIEL",), 6, first_date="2024-10-17"),
    # Running: started six weeks before the seeding week
    CourseSchedule(7009, ("ONLINE", "KIEL"), 12, weekday=0, first_week=-6),
    CourseSchedule(7010, ("ONLINE", "KIEL"), 12, weekday=1, first_week=-5),
    # Upcoming: starts three weeks after the seeding week
    CourseSchedule(7011, ("ONLINE", "KIEL"), 10, weekday=2, first_week=3),
]


class SqlRaw(str):
    """A SQL expression emitted without quoting."""


def sql_value(value: object) -> str:
    if isinstance(value, SqlRaw):
        return str(value)
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def values_sql(rows: list[tuple[object, ...]]) -> str:
    return ",\n  ".join("(" + ", ".join(sql_value(v) for v in row) + ")" for row in rows)


@dataclass
class CourseParticipant:
    user_id: str
    first_name: str
    last_name: str
    email: str
    status: str

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


@dataclass
class SeedRecord:
    """One Attendance Record (offsets in seconds from the session start)."""

    name: str
    source: str
    location: str
    join: int
    email: str | None = None
    leave: int | None = None
    duration: int | None = None
    interruptions: int | None = None
    owner: str | None = None
    match_type: str | None = None
    score: int | None = None


@dataclass
class SessionPlan:
    session_id: int
    number: int
    checked: bool
    records: list[SeedRecord] = field(default_factory=list)


def _rng(*parts: object) -> random.Random:
    return random.Random(zlib.crc32("|".join(str(p) for p in parts).encode()))


def _local_start(schedule: CourseSchedule, number: int, hour: int) -> SqlRaw:
    """Session start/end as a Berlin wall-clock time, so DST shifts keep 16:00."""
    if schedule.relative:
        week = schedule.first_week + number - 1
        local = (
            f"date_trunc('week', now() AT TIME ZONE 'Europe/Berlin') "
            f"+ interval '{schedule.weekday} days {hour} hours' + ({week}) * interval '7 days'"
        )
    else:
        local = f"'{schedule.first_date} {hour:02d}:00:00'::timestamp + {number - 1} * interval '7 days'"
    return SqlRaw(f"(({local}) AT TIME ZONE 'Europe/Berlin')")


def _is_checked(schedule: CourseSchedule, number: int) -> bool:
    """Finished sessions only; a relative session in the seeding week may still be ahead."""
    if not schedule.relative:
        return True
    return schedule.first_week + number - 1 < 0


def _sorted_tokens(name: str) -> str:
    return " ".join(sorted(re.sub(r"[,.@_:]", " ", name.lower()).split()))


def _score(a: str, b: str) -> int:
    return round(difflib.SequenceMatcher(None, _sorted_tokens(a), _sorted_tokens(b)).ratio() * 100)


def _location_option(record: SeedRecord) -> str:
    if record.source == "ZOOM":
        return "ONLINE"
    return "HEIDE" if record.location == "H04" else "KIEL"


def _plan_course(schedule: CourseSchedule, participants: list[CourseParticipant]) -> list[SessionPlan]:
    first_name_counts: dict[str, int] = {}
    for p in participants:
        key = p.first_name.lower()
        first_name_counts[key] = first_name_counts.get(key, 0) + 1

    # Per participant: where they join from, how they show up in Zoom and which sessions they attend.
    profiles = {}
    for p in participants:
        rng = _rng(schedule.course_id, p.user_id)
        place = rng.choices(schedule.locations, weights=[3 if loc == "ONLINE" else 2 for loc in schedule.locations])[0]
        style = rng.choices(["full", "email", "last_first", "first"], weights=[75, 10, 7, 8])[0]
        attend_rate = {"COMPLETED": 0.93}.get(p.status, 0.6 if not schedule.relative else 0.85)
        attends = [rng.random() < attend_rate for _ in range(schedule.session_count)]
        if p.status == "COMPLETED":
            # Completed means at most two missed sessions (maxMissedSessions).
            missed = [i for i, a in enumerate(attends) if not a]
            for i in missed[2:]:
                attends[i] = True
        profiles[p.user_id] = (place, style, attends)

    plans = []
    for number in range(1, schedule.session_count + 1):
        session_id = 72000 + (schedule.course_id - 7000) * 100 + number
        plan = SessionPlan(session_id, number, _is_checked(schedule, number))
        plans.append(plan)
        if not plan.checked:
            continue
        rng = _rng(schedule.course_id, number)
        for p in participants:
            place, style, attends = profiles[p.user_id]
            attended = attends[number - 1]
            if place != "ONLINE":
                if attended:
                    plan.records.append(
                        SeedRecord(
                            name=p.full_name,
                            source="LIMESURVEY",
                            location="H04" if place == "HEIDE" else KIEL_PLACE,
                            join=rng.randint(-15 * 60, 10 * 60),
                            owner=p.user_id,
                            match_type="NAME",
                            score=100,
                        )
                    )
                continue
            short_stay = not attended and rng.random() < 0.25
            if not attended and not short_stay:
                continue
            share = rng.uniform(0.82, 1.0) if attended else rng.uniform(0.08, 0.4)
            duration = int(share * SESSION_SECONDS)
            interruptions = rng.choice([0, 0, 0, 1, 1, 2, 3])
            join = rng.randint(-5 * 60, 10 * 60) if attended else rng.randint(0, 60 * 60)
            record = SeedRecord(
                name=p.full_name,
                source="ZOOM",
                location="ZOOM",
                join=join,
                leave=min(join + duration + interruptions * 90, SESSION_SECONDS + 15 * 60),
                duration=duration,
                interruptions=interruptions,
                owner=p.user_id,
                match_type="NAME",
                score=100,
            )
            if style == "email":
                record.name, record.email, record.match_type, record.score = "Work Laptop", p.email, "EMAIL", None
            elif style == "last_first":
                record.name = f"{p.last_name}, {p.first_name}"
            elif style == "first":
                record.name = p.first_name
                if first_name_counts[p.first_name.lower()] == 1:
                    record.match_type, record.score = "PARTIAL_NAME", _score(p.full_name, p.first_name)
                else:
                    # Ambiguous first name: the check cannot match it to anyone.
                    record.owner = record.match_type = record.score = None
            plan.records.append(record)

        for name in rng.sample(NOISE_ZOOM_NAMES, rng.randint(0, 2)) if "ONLINE" in schedule.locations else []:
            minutes = rng.randint(1, 30)
            join = rng.randint(-5 * 60, 30 * 60)
            plan.records.append(
                SeedRecord(name, "ZOOM", "ZOOM", join, leave=join + minutes * 60, duration=minutes * 60, interruptions=0)
            )
        if any(loc != "ONLINE" for loc in schedule.locations) and rng.random() < 0.3:
            plan.records.append(SeedRecord(rng.choice(NOISE_CHECK_IN_NAMES), "LIMESURVEY", KIEL_PLACE, rng.randint(-10 * 60, 0)))
        plan.records.sort(key=lambda r: (r.join, r.name))
    return plans


def _attendance_rows(
    schedule: CourseSchedule, plans: list[SessionPlan], participants: list[CourseParticipant], next_id: list[int]
) -> list[tuple[object, ...]]:
    rows = []
    for plan in plans:
        if not plan.checked:
            continue
        by_owner = {r.owner: (i, r) for i, r in enumerate(plan.records) if r.owner}
        rng = _rng("manual", schedule.course_id, plan.number)
        for p in participants:
            next_id[0] += 1
            if p.user_id in by_owner:
                index, record = by_owner[p.user_id]
                counts = record.source != "ZOOM" or record.duration >= MIN_ATTENDANCE_SHARE * SESSION_SECONDS
                status = "ATTENDED" if counts else "MISSED"
                rows.append(
                    (next_id[0], plan.session_id, p.user_id, status, "AUTO", record.email or record.name,
                     record.source, record.join, record.leave, record.duration, record.interruptions,
                     record.location, record.match_type, record.score, index, None)
                )
                continue
            best: dict[str, tuple[int, str]] = {}
            for record in plan.records:
                location = _location_option(record)
                score = _score(p.full_name, record.name)
                if location not in best or score > best[location][0]:
                    best[location] = (score, record.name)
            candidates = sorted(
                ({"location": loc, "identifier": name, "score": score} for loc, (score, name) in best.items()),
                key=lambda c: -c["score"],
            )
            rows.append(
                (next_id[0], plan.session_id, p.user_id, "MISSED", "AUTO",
                 candidates[0]["identifier"] if candidates else None,
                 ("ZOOM" if candidates[0]["location"] == "ONLINE" else "LIMESURVEY") if candidates else None,
                 None, None, None, None, None, "NONE", None, None, json.dumps(candidates) if candidates else None)
            )
            # An organizer corrects a few unrecognised participants by hand.
            if rng.random() < 0.06:
                next_id[0] += 1
                rows.append(
                    (next_id[0], plan.session_id, p.user_id, "ATTENDED", "MANUAL", None, "INSTRUCTOR",
                     None, None, None, None, None, None, None, None, None)
                )
    return rows


def _attendance_data_sql(plan: SessionPlan) -> str:
    """Session.attendanceData in pandas `to_json()` layout ({column: {index: value}}),
    with join/leave times computed from the session's own start."""
    columns: dict[str, dict[str, object]] = {
        "name": {}, "email": {}, "duration": {}, "interruptionCount": {}, "source": {}, "location": {}
    }
    joins: dict[str, int] = {}
    leaves: dict[str, int] = {}
    for i, record in enumerate(plan.records):
        key = str(i)
        columns["name"][key] = record.name
        columns["email"][key] = record.email
        columns["duration"][key] = record.duration
        columns["interruptionCount"][key] = record.interruptions
        columns["source"][key] = record.source
        columns["location"][key] = record.location
        joins[key] = record.join
        if record.leave is not None:
            leaves[key] = record.leave
    fixed = json.dumps(columns, ensure_ascii=False, separators=(",", ":"))

    def times(offsets: dict[str, int]) -> str:
        return (
            "(SELECT jsonb_object_agg(k, (extract(epoch FROM s.\"startDateTime\") * 1000)::bigint + v::bigint * 1000) "
            f"FROM jsonb_each_text($j${json.dumps(offsets)}$j$::jsonb) AS t(k, v))"
        )

    return (
        f'UPDATE public."Session" s SET "attendanceData" = ($j${fixed}$j$::jsonb\n'
        f"  || jsonb_build_object('joinDateTime', {times(joins)}, 'leaveDateTime', {times(leaves)}))::text\n"
        f"WHERE s.id = {plan.session_id};\n"
    )


def build_attendance_sql(participants_by_course: dict[int, list[CourseParticipant]]) -> str:
    location_rows, session_rows, address_rows, attendance_rows, data_sql = [], [], [], [], []
    next_attendance_id = [800000]
    seeded_at = "2026-04-20 05:00:00+00"

    for schedule in COURSE_SCHEDULES:
        participants = sorted(
            participants_by_course.get(schedule.course_id, []), key=lambda p: (p.last_name, p.first_name, p.user_id)
        )
        location_ids = {}
        for k, option in enumerate(schedule.locations, start=1):
            location_ids[option] = 70000 + (schedule.course_id - 7000) * 10 + k
            location_rows.append(
                (location_ids[option], schedule.course_id, seeded_at, seeded_at, option,
                 ADDRESSES[option].format(course_id=schedule.course_id))
            )

        plans = _plan_course(schedule, participants)
        for plan in plans:
            session_rows.append(
                (plan.session_id, f"Session {plan.number}", "", _local_start(schedule, plan.number, 16),
                 _local_start(schedule, plan.number, 18), schedule.course_id, seeded_at, seeded_at, plan.checked)
            )
            for k, option in enumerate(schedule.locations, start=1):
                address_rows.append(
                    (plan.session_id * 10 + k, seeded_at, seeded_at, plan.session_id,
                     ADDRESSES[option].format(course_id=schedule.course_id), location_ids[option])
                )
            if plan.checked:
                data_sql.append(_attendance_data_sql(plan))
        attendance_rows += _attendance_rows(schedule, plans, participants, next_attendance_id)

    sql = [BEGIN_MARKER, "-- Generated by backend/seeds/utils/generate_ml_degree_seed.py (course_attendance_seed.py)"]
    sql.append(
        'INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress") VALUES\n  '
        + values_sql(location_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    )
    sql.append(
        'INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, questionaire_sent) VALUES\n  '
        + values_sql(session_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    )
    sql.append(
        'INSERT INTO public."SessionAddress" (id, created_at, updated_at, "sessionId", address, "courseLocationId") VALUES\n  '
        + values_sql(address_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    )
    sql.extend(data_sql)
    # Times are offsets from the session start; MANUAL rows are instructor corrections made after the session.
    for start in range(0, len(attendance_rows), 2000):
        chunk = attendance_rows[start:start + 2000]
        sql.append(
            'INSERT INTO public."Attendance" (id, "sessionId", "userId", status, created_at, updated_at, '
            '"recordedIdentifier", source, "startDateTime", "endDateTime", "totalAttendanceTime", "interruptionCount", '
            'location, "matchType", "matchScore", "attendanceRecordIndex", "closestCandidates")\n'
            "SELECT v.id, v.session_id, v.user_id::uuid, v.status,\n"
            "       s.\"endDateTime\" + CASE v.kind WHEN 'MANUAL' THEN interval '2 days' ELSE interval '6 hours' END,\n"
            "       s.\"endDateTime\" + CASE v.kind WHEN 'MANUAL' THEN interval '2 days' ELSE interval '6 hours' END,\n"
            "       v.identifier, v.source,\n"
            "       s.\"startDateTime\" + v.join_offset::int * interval '1 second',\n"
            "       s.\"startDateTime\" + v.leave_offset::int * interval '1 second',\n"
            "       v.duration::int, v.interruptions::int, v.location, v.match_type, v.score::int, v.record_index::int,\n"
            "       v.candidates::jsonb\n"
            "FROM (VALUES\n  " + values_sql(chunk) + "\n"
            ") AS v(id, session_id, user_id, status, kind, identifier, source, join_offset, leave_offset, duration,\n"
            "       interruptions, location, match_type, score, record_index, candidates)\n"
            'JOIN public."Session" s ON s.id = v.session_id\n'
            "ON CONFLICT (id) DO NOTHING;\n"
        )
    sql.append(END_MARKER)
    return "\n".join(sql) + "\n"


_INSERT_RE = re.compile(r'^INSERT INTO public\."(\w+)" \((.*?)\) VALUES \((.*)\);\s*$')


def _split_values(text: str) -> list[str]:
    values, current, quoted, depth, i = [], "", False, 0, 0
    while i < len(text):
        c = text[i]
        if quoted:
            current += c
            if c == "'":
                if text[i + 1:i + 2] == "'":
                    current += "'"
                    i += 1
                else:
                    quoted = False
        elif c == "'":
            quoted, current = True, current + c
        elif c in "()":
            depth += 1 if c == "(" else -1
            current += c
        elif c == "," and depth == 0:
            values.append(current.strip())
            current = ""
        else:
            current += c
        i += 1
    values.append(current.strip())
    return [None if v == "NULL" else v[1:-1].replace("''", "'") if v.startswith("'") else v for v in values]


def fixture_participants(seed_text: str) -> list[tuple[int, CourseParticipant]]:
    """Participants of the scheduled courses from hand-written single-row INSERTs
    (the dev accounts), joined with their single-row User INSERTs."""
    course_ids = {s.course_id for s in COURSE_SCHEDULES}
    users, enrollments = {}, []
    for line in seed_text.split("\n"):
        m = _INSERT_RE.match(line)
        if not m or m.group(1) not in ("User", "CourseEnrollment"):
            continue
        cols = [c.strip().strip('"') for c in m.group(2).split(",")]
        row = dict(zip(cols, _split_values(m.group(3))))
        if m.group(1) == "User":
            users[row["id"]] = row
        elif row["status"] in PARTICIPANT_STATUSES and row["courseId"].isdigit() and int(row["courseId"]) in course_ids:
            enrollments.append(row)
    result = []
    for row in enrollments:
        user = users.get(row["userId"])
        if user:
            result.append(
                (int(row["courseId"]),
                 CourseParticipant(user["id"], user["firstName"], user["lastName"], user["email"], row["status"]))
            )
    return result


def replace_block(seed_text: str, block: str) -> str:
    if BEGIN_MARKER in seed_text and END_MARKER in seed_text:
        start = seed_text.index(BEGIN_MARKER)
        end = seed_text.index(END_MARKER, start) + len(END_MARKER)
        if seed_text[end:end + 1] == "\n":
            end += 1
        return seed_text[:start] + block + seed_text[end:]
    return seed_text.rstrip("\n") + "\n\n" + block
