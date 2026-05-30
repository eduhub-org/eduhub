#!/usr/bin/env python3
"""Generate an opt-in performance seed for degree page load testing."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

try:
    from .generate_ml_degree_seed import (
        FIRST_NAMES,
        LAST_NAMES,
        SqlRaw,
        insert_sql,
        timestamp_plus,
    )
except ImportError:
    from generate_ml_degree_seed import (
        FIRST_NAMES,
        LAST_NAMES,
        SqlRaw,
        insert_sql,
        timestamp_plus,
    )


DEFAULT_USER_COUNT = 5000
DEGREE_ID = 8000
COURSE_IDS = list(range(8001, 8016))
EVENT_COURSE_IDS = list(range(8101, 8106))
ALL_LINKED_COURSE_IDS = COURSE_IDS + EVENT_COURSE_IDS
GENERATED_AT = "'2026-05-30 10:00:00+00'::timestamptz"
DEGREE_ENROLLMENT_ID_BASE = 80_000_000
PASSED_ENROLLMENT_ID_BASE = 120_000_000
CURRENT_ENROLLMENT_ID_BASE = 160_000_000
EVENT_ENROLLMENT_ID_BASE = 200_000_000
ATTENDANCE_ID_BASE = 80_000_000
PARTICIPANT_ID_STRIDE = 100


@dataclass(frozen=True)
class PerfParticipant:
    index: int
    user_id: str
    first_name: str
    last_name: str
    email: str
    passed_courses: list[int]
    current_courses: list[int]
    event_courses: list[int]
    degree_status: str
    completion_requirements_met: bool


def user_id_for(index: int) -> str:
    return f"91000000-0000-0000-0000-{index:012d}"


def name_for(index: int) -> tuple[str, str]:
    first_name = FIRST_NAMES[
        ((index - 1) + ((index - 1) // len(FIRST_NAMES))) % len(FIRST_NAMES)
    ]
    last_name = LAST_NAMES[
        ((index - 1) + ((index - 1) // len(LAST_NAMES))) % len(LAST_NAMES)
    ]
    return first_name, last_name


def course_window(index: int, width: int, offset: int = 0) -> list[int]:
    start = ((index - 1) + offset) % len(COURSE_IDS)
    return [COURSE_IDS[(start + step) % len(COURSE_IDS)] for step in range(width)]


def event_window(index: int, width: int, offset: int = 0) -> list[int]:
    start = ((index - 1) + offset) % len(EVENT_COURSE_IDS)
    return [EVENT_COURSE_IDS[(start + step) % len(EVENT_COURSE_IDS)] for step in range(width)]


def passed_courses_for(index: int) -> list[int]:
    pattern = (index - 1) % 12
    if pattern in (0, 7, 11):
        return []
    if pattern == 1:
        return course_window(index, 1)
    if pattern in (2, 9):
        return course_window(index, 2)
    if pattern in (3, 4, 5, 10):
        return course_window(index, 3)
    if pattern == 6:
        return course_window(index, 5)
    if pattern == 8:
        return course_window(index, 2, offset=2)
    return []


def current_courses_for(index: int, passed_courses: list[int]) -> list[int]:
    pattern = (index - 1) % 12
    width = 1
    if pattern in (2, 6, 9):
        width = 2
    if pattern == 10:
        width = 3
    return [
        course_id
        for course_id in course_window(index, width, offset=7)
        if course_id not in passed_courses
    ]


def event_courses_for(index: int) -> list[int]:
    pattern = (index - 1) % 12
    if pattern == 6:
        return event_window(index, 1 + ((index // 12) % 4))
    if pattern in (4, 7, 8):
        return event_window(index, 1)
    if pattern == 5:
        return event_window(index, 2)
    return []


def build_participant(index: int) -> PerfParticipant:
    first_name, last_name = name_for(index)
    passed_courses = passed_courses_for(index)
    current_courses = current_courses_for(index, passed_courses)
    event_courses = event_courses_for(index)
    completion_requirements_met = len(passed_courses) * 5 >= 12.5 and len(event_courses) >= 1
    if completion_requirements_met:
        degree_status = "COMPLETED"
    elif index % 70 == 0:
        degree_status = "INVITED"
    elif index % 53 == 0:
        degree_status = "APPLIED"
    elif index % 41 == 0:
        degree_status = "CANCELLED"
    else:
        degree_status = "CONFIRMED"

    email = f"{first_name}.{last_name}.perf{index}@example.com".lower()
    return PerfParticipant(
        index=index,
        user_id=user_id_for(index),
        first_name=first_name,
        last_name=last_name,
        email=email,
        passed_courses=passed_courses,
        current_courses=current_courses,
        event_courses=event_courses,
        degree_status=degree_status,
        completion_requirements_met=completion_requirements_met,
    )


def values_table(rows: list[tuple[object, ...]], columns: list[str]) -> str:
    rendered_rows = ",\n  ".join(
        "(" + ", ".join(sql_value(value) for value in row) + ")" for row in rows
    )
    return f"(VALUES\n  {rendered_rows}\n) AS seed({', '.join(columns)})"


def static_seed_sql(user_count: int) -> str:
    course_ids_sql = ", ".join(str(course_id) for course_id in ALL_LINKED_COURSE_IDS)
    all_course_ids_sql = ", ".join(
        str(course_id) for course_id in [DEGREE_ID, *ALL_LINKED_COURSE_IDS]
    )
    event_course_ids_sql = ", ".join(str(course_id) for course_id in EVENT_COURSE_IDS)

    course_rows: list[tuple[object, ...]] = [
        (
            DEGREE_ID,
            "Performance Test Degree",
            "APPLICANTS_INVITED",
            "12.5",
            "Large opt-in seed degree for course page performance testing.",
            "EN",
            "2026-12-31",
            "0",
            True,
            False,
            2,
            "NONE",
            None,
            SqlRaw(GENERATED_AT),
            SqlRaw(GENERATED_AT),
            2,
            "Performance heading",
            "Performance details",
            "Generated performance test degree.",
            "Generated performance test details.",
            "Measure large course and degree participation views.",
            "https://chat.opencampus.sh",
            user_count + 100,
            "18:00:00",
            "16:00:00",
            True,
            None,
            "APPROVAL_WITH_INPUT",
        )
    ]

    for offset, course_id in enumerate(COURSE_IDS, start=1):
        course_rows.append(
            (
                course_id,
                f"Performance Course {offset:02d}",
                "APPLICANTS_INVITED",
                "5",
                "Generated linked course for performance testing.",
                "EN",
                "2026-12-31",
                "0",
                True,
                True,
                2,
                "NONE",
                None,
                SqlRaw(GENERATED_AT),
                SqlRaw(GENERATED_AT),
                5 if offset % 2 else 6,
                None,
                None,
                None,
                None,
                None,
                None,
                user_count,
                "18:00:00",
                "16:00:00",
                True,
                None,
                "APPROVAL_WITH_INPUT",
            )
        )

    for offset, course_id in enumerate(EVENT_COURSE_IDS, start=1):
        course_rows.append(
            (
                course_id,
                f"Performance Event {offset:02d}",
                "APPLICANTS_INVITED",
                "NONE",
                "Generated event for performance testing.",
                "EN",
                "2026-12-31",
                "0",
                False,
                True,
                0,
                "NONE",
                None,
                SqlRaw(GENERATED_AT),
                SqlRaw(GENERATED_AT),
                3,
                None,
                None,
                None,
                None,
                None,
                None,
                user_count,
                "18:00:00",
                "10:00:00",
                True,
                None,
                "APPROVAL_WITH_INPUT",
            )
        )

    sql = [
        "-- Performance Test Degree seed",
        "-- Generated by backend/seeds/utils/generate_performance_degree_seed.py",
        f"-- Participant count: {user_count}",
        "",
        "BEGIN;",
        "",
        f"""
DELETE FROM public."Attendance"
WHERE "userId"::text LIKE '91000000-0000-0000-0000-%'
   OR "sessionId" BETWEEN 81001 AND 81005;

DELETE FROM public."CourseEnrollment"
WHERE "userId"::text LIKE '91000000-0000-0000-0000-%'
   OR "courseId" IN ({all_course_ids_sql});

DELETE FROM public."Session"
WHERE id BETWEEN 81001 AND 81005
   OR "courseId" IN ({event_course_ids_sql});

DELETE FROM public."CourseDegree"
WHERE "degreeCourseId" = {DEGREE_ID}
   OR "courseId" IN ({course_ids_sql});

DELETE FROM public."User"
WHERE id::text LIKE '91000000-0000-0000-0000-%';

DELETE FROM public."Course"
WHERE id IN ({all_course_ids_sql});
""".strip(),
        "",
        insert_sql(
            "Course",
            [
                "id",
                "title",
                "status",
                "ects",
                "tagline",
                "language",
                '"applicationEnd"',
                "cost",
                '"achievementCertificatePossible"',
                '"attendanceCertificatePossible"',
                '"maxMissedSessions"',
                '"weekDay"',
                '"coverImage"',
                "created_at",
                "updated_at",
                '"programId"',
                '"headingDescriptionField1"',
                '"headingDescriptionField2"',
                '"contentDescriptionField1"',
                '"contentDescriptionField2"',
                '"learningGoals"',
                '"chatLink"',
                '"maxParticipants"',
                '"endTime"',
                '"startTime"',
                "published",
                '"externalRegistrationLink"',
                '"registrationType"',
            ],
            course_rows,
        ),
    ]

    sql.append(
        """
INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at)
SELECT 8000 + row_number() OVER (),
       linked_course.course_id,
       8000,
       '2026-05-30 10:00:00+00'::timestamptz,
       '2026-05-30 10:00:00+00'::timestamptz
FROM unnest(ARRAY[8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009, 8010, 8011, 8012, 8013, 8014, 8015, 8101, 8102, 8103, 8104, 8105]) AS linked_course(course_id)
ON CONFLICT (id) DO NOTHING;
""".strip()
        + "\n"
    )

    sql.append(
        """
INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent)
SELECT 81000 + event_series.event_index,
       'Performance attendance checkpoint',
       'Generated event attendance session',
       ('2026-06-01 10:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '14 days')),
       ('2026-06-01 18:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '14 days')),
       8100 + event_series.event_index,
       '2026-05-30 10:00:00+00'::timestamptz,
       '2026-05-30 10:00:00+00'::timestamptz,
       NULL,
       true
FROM generate_series(1, 5) AS event_series(event_index)
ON CONFLICT (id) DO NOTHING;
""".strip()
        + "\n"
    )
    return "\n".join(sql)


def build_sql(user_count: int) -> str:
    participants = [build_participant(index) for index in range(1, user_count + 1)]

    user_rows: list[tuple[object, ...]] = []
    enrollment_rows: list[tuple[object, ...]] = []
    attendance_rows: list[tuple[object, ...]] = []

    for participant in participants:
        index = participant.index
        user_rows.append(
            (
                participant.user_id,
                participant.first_name,
                participant.last_name,
                participant.email,
                None,
                {
                    0: "https://www.linkedin.com",
                    1: "https://www.github.com",
                    2: "https://www.xing.com",
                }[index % 3],
                index % 2 == 0,
                f"perf-degree-{index}",
                timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                str(300000 + index),
                "ACTIVE",
                20000 + index,
                None,
                "EMPLOYED_PART_TIME" if index % 5 == 0 else "UNIVERSITY_STUDENT",
                None,
                None,
            )
        )

        enrollment_rows.append(
            (
                DEGREE_ENROLLMENT_ID_BASE + (index * PARTICIPANT_ID_STRIDE),
                DEGREE_ID,
                participant.user_id,
                participant.degree_status,
                "Seeded performance degree participation.",
                "UNRATED",
                f"{participant.user_id}/{DEGREE_ID}/achievement_certificate.pdf"
                if participant.completion_requirements_met
                else None,
                None,
                timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                SqlRaw("'2026-07-01'::date") if participant.degree_status == "INVITED" else None,
            )
        )

        for course_id in participant.passed_courses:
            enrollment_rows.append(
                (
                    PASSED_ENROLLMENT_ID_BASE
                    + (index * PARTICIPANT_ID_STRIDE)
                    + course_id
                    - 8000,
                    course_id,
                    participant.user_id,
                    "COMPLETED",
                    "Seeded passed performance course.",
                    "UNRATED",
                    f"{participant.user_id}/{course_id}/achievement_certificate.pdf",
                    f"{participant.user_id}/{course_id}/attendance_certificate.pdf",
                    timestamp_plus("2026-01-01 10:00:00+00", (course_id - 8000), "day"),
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    None,
                )
            )

        for course_id in participant.current_courses:
            enrollment_rows.append(
                (
                    CURRENT_ENROLLMENT_ID_BASE
                    + (index * PARTICIPANT_ID_STRIDE)
                    + course_id
                    - 8000,
                    course_id,
                    participant.user_id,
                    "CONFIRMED",
                    "Seeded current performance course.",
                    "UNRATED",
                    None,
                    None,
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    None,
                )
            )

        for event_index, course_id in enumerate(participant.event_courses, start=1):
            event_position = EVENT_COURSE_IDS.index(course_id) + 1
            enrollment_rows.append(
                (
                    EVENT_ENROLLMENT_ID_BASE
                    + (index * PARTICIPANT_ID_STRIDE)
                    + event_index,
                    course_id,
                    participant.user_id,
                    "COMPLETED",
                    "Seeded attended performance event.",
                    "UNRATED",
                    None,
                    f"{participant.user_id}/{course_id}/attendance_certificate.pdf",
                    timestamp_plus("2026-06-01 10:00:00+00", event_position, "day"),
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    None,
                )
            )
            attendance_rows.append(
                (
                    ATTENDANCE_ID_BASE + (index * 10) + event_index,
                    81000 + event_position,
                    participant.user_id,
                    "ATTENDED",
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    timestamp_plus("2026-05-30 10:00:00+00", index, "second"),
                    participant.email,
                    "INSTRUCTOR",
                    timestamp_plus("2026-06-01 10:00:00+00", (event_position - 1) * 14, "day"),
                    timestamp_plus("2026-06-01 18:00:00+00", (event_position - 1) * 14, "day"),
                    28800,
                    0,
                )
            )

    sql = static_seed_sql(user_count)
    sql += "\n"
    sql += insert_sql(
        "User",
        [
            "id",
            '"firstName"',
            '"lastName"',
            "email",
            "picture",
            '"externalProfile"',
            '"newsletterRegistration"',
            '"anonymousId"',
            "created_at",
            "updated_at",
            '"matriculationNumber"',
            "status",
            '"integerId"',
            '"organizationId"',
            "occupation",
            '"zipCode"',
            "country",
        ],
        user_rows,
    )
    sql += "\n"
    sql += insert_sql(
        "CourseEnrollment",
        [
            "id",
            '"courseId"',
            '"userId"',
            "status",
            '"motivationLetter"',
            '"motivationRating"',
            '"achievementCertificateURL"',
            '"attendanceCertificateURL"',
            "created_at",
            "updated_at",
            '"invitationExpirationDate"',
        ],
        enrollment_rows,
    )
    sql += "\n"
    sql += insert_sql(
        "Attendance",
        [
            "id",
            '"sessionId"',
            '"userId"',
            "status",
            "created_at",
            "updated_at",
            '"recordedIdentifier"',
            "source",
            '"startDateTime"',
            '"endDateTime"',
            '"totalAttendanceTime"',
            '"interruptionCount"',
        ],
        attendance_rows,
    )
    sql += """

SELECT pg_catalog.setval(pg_get_serial_sequence('public."Attendance"', 'id'), (SELECT max(id) FROM public."Attendance"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Course"', 'id'), (SELECT max(id) FROM public."Course"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."CourseDegree"', 'id'), (SELECT max(id) FROM public."CourseDegree"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."CourseEnrollment"', 'id'), (SELECT max(id) FROM public."CourseEnrollment"), true);
SELECT pg_catalog.setval(pg_get_serial_sequence('public."Session"', 'id'), (SELECT max(id) FROM public."Session"), true);

COMMIT;
"""
    return sql


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the performance degree seed SQL.")
    parser.add_argument("--users", type=int, default=DEFAULT_USER_COUNT)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1]
        / "performance"
        / "performance_degree_seed.sql",
    )
    parser.add_argument("--print-only", action="store_true")
    args = parser.parse_args()

    generated_sql = build_sql(args.users)
    if args.print_only:
        print(generated_sql, end="")
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(generated_sql)


if __name__ == "__main__":
    main()
