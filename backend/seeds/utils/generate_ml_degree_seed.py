#!/usr/bin/env python3
"""Generate the default ML degree seed block.

The generated SQL intentionally uses bulk INSERT statements instead of a
procedural per-user PL/pgSQL loop. Keep the participant-pattern logic here so
the checked-in default seed can stay fast to load while remaining easy to
change.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


BEGIN_MARKER = "-- BEGIN GENERATED ML_DEGREE_SEED"
END_MARKER = "-- END GENERATED ML_DEGREE_SEED"
DEFAULT_USER_COUNT = 300
DEGREE_ID = 7000
EVENT_COURSE_IDS = [7101, 7102, 7103, 7104, 7105]
EVENT_COUNT_PATTERNS = [0, 0, 0, 0, 1, 2, 4, 1, 1, 0, 0, 0]

FIRST_NAMES = [
    "Mina",
    "Jonas",
    "Aisha",
    "Leon",
    "Sofia",
    "Noah",
    "Amara",
    "Felix",
    "Elena",
    "Yusuf",
    "Nina",
    "Mateo",
    "Leila",
    "Oskar",
    "Priya",
    "Lena",
    "Samir",
    "Maya",
    "Theo",
    "Hannah",
    "Anika",
    "Daniel",
    "Sara",
    "Tobias",
    "Nora",
    "Ibrahim",
    "Clara",
    "David",
    "Rania",
    "Emil",
]

LAST_NAMES = [
    "Schmidt",
    "Mueller",
    "Khan",
    "Weber",
    "Garcia",
    "Fischer",
    "Nguyen",
    "Becker",
    "Silva",
    "Hoffmann",
    "Ivanova",
    "Koch",
    "Ahmed",
    "Schulz",
    "Patel",
    "Wagner",
    "Rossi",
    "Neumann",
    "Yilmaz",
    "Krause",
    "Santos",
    "Schneider",
    "Nowak",
    "Bauer",
    "Kim",
    "Lehmann",
    "Rahman",
    "Wolf",
    "Fernandez",
    "Petersen",
    "Meyer",
    "Klein",
    "Lange",
    "Schroeder",
    "Richter",
    "Walter",
    "Koenig",
    "Hartmann",
    "Werner",
    "Schwarz",
    "Zimmermann",
    "Braun",
    "Krueger",
    "Hofmann",
    "Ludwig",
    "Berger",
    "Albrecht",
    "Sommer",
    "Brandt",
    "Jung",
    "Ali",
    "Hassan",
    "Singh",
    "Meier",
    "Moreno",
    "Costa",
    "Novak",
    "Horvath",
    "Petrov",
    "Sokolov",
    "Popescu",
    "Ionescu",
    "Kowalski",
    "Lis",
    "Dvorak",
    "Svoboda",
    "Benali",
    "El Amrani",
    "Diop",
    "Mensah",
    "Okafor",
    "Adebayo",
    "Ndiaye",
    "Mbeki",
    "Chen",
    "Wang",
    "Li",
    "Zhang",
    "Liu",
    "Tanaka",
    "Sato",
    "Yamamoto",
    "Park",
    "Choi",
    "Jensen",
    "Nielsen",
    "Andersen",
    "Larsen",
    "Johansson",
    "Lindberg",
    "Virtanen",
    "Korhonen",
    "Hernandez",
    "Lopez",
    "Martinez",
    "Gonzalez",
    "Rodriguez",
    "Torres",
    "Ramirez",
    "Castro",
    "Bennett",
    "Carter",
    "Morgan",
    "Taylor",
    "Wilson",
    "Brown",
    "Johnson",
    "Miller",
    "Davis",
    "Clark",
    "Dubois",
    "Moreau",
    "Lefevre",
    "Martin",
    "Bernard",
    "Roux",
    "Conti",
    "Bianchi",
    "Esposito",
    "Ferrari",
]

COURSE_ECTS = {
    7001: 5.0,
    7002: 5.0,
    7003: 5.0,
    7004: 5.0,
    7005: 5.0,
    7006: 5.0,
    7007: 5.0,
    7008: 2.5,
    7009: 5.0,
    7010: 5.0,
    7011: 5.0,
    7012: 0.0,
}


class SqlRaw(str):
    """A SQL expression that should be emitted without quoting."""


@dataclass(frozen=True)
class Participant:
    index: int
    user_id: str
    first_name: str
    last_name: str
    email: str
    pattern_variant: int
    passed_courses: list[int]
    enrolled_courses: list[int]
    attended_event_count: int
    status: str
    motivation_rating: str
    completion_requirements_met: bool


def sql_value(value: object) -> str:
    if isinstance(value, SqlRaw):
        return str(value)
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def row_sql(row: Iterable[object]) -> str:
    return "(" + ", ".join(sql_value(value) for value in row) + ")"


def insert_sql(table: str, columns: list[str], rows: list[tuple[object, ...]]) -> str:
    if not rows:
        return ""
    rendered_rows = ",\n  ".join(row_sql(row) for row in rows)
    return (
        f'INSERT INTO public."{table}" ({", ".join(columns)}) VALUES\n'
        f"  {rendered_rows}\n"
        "ON CONFLICT (id) DO NOTHING;\n"
    )


def timestamp_plus(base: str, amount: int, unit: str) -> SqlRaw:
    return SqlRaw(f"'{base}'::timestamptz + ({amount} * interval '1 {unit}')")


def date_value(value: str) -> SqlRaw:
    return SqlRaw(f"'{value}'::date")


def user_id_for(index: int) -> str:
    return f"90000000-0000-0000-0000-{index:012d}"


def name_for(index: int) -> tuple[str, str]:
    first_name = FIRST_NAMES[((index - 1) + ((index - 1) // len(FIRST_NAMES))) % len(FIRST_NAMES)]
    last_name = LAST_NAMES[((index - 1) + ((index - 1) // len(LAST_NAMES))) % len(LAST_NAMES)]
    return first_name, last_name


def passed_courses_for(index: int, pattern_variant: int) -> list[int]:
    by_variant = index_mod = (index - 1) % 12
    if index_mod in (0, 7, 11):
        return []
    if index_mod == 1:
        return [[7001], [7002], [7003], [7004], [7005], [7006]][pattern_variant]
    if index_mod == 2:
        return [
            [7001, 7002],
            [7003, 7004],
            [7005, 7006],
            [7007, 7009],
            [7010, 7011],
            [7002, 7005],
        ][pattern_variant]
    if index_mod == 3:
        return [
            [7001, 7002, 7008],
            [7003, 7004, 7008],
            [7005, 7006, 7008],
            [7007, 7009, 7008],
            [7010, 7011, 7008],
            [7001, 7005, 7008],
        ][pattern_variant]
    if index_mod == 4:
        return [
            [7001, 7002, 7003],
            [7004, 7005, 7006],
            [7007, 7009, 7010],
            [7002, 7005, 7011],
            [7001, 7006, 7009],
            [7003, 7007, 7010],
        ][pattern_variant]
    if index_mod == 5:
        return [
            [7002, 7003, 7004],
            [7005, 7006, 7007],
            [7009, 7010, 7011],
            [7001, 7004, 7007],
            [7002, 7006, 7010],
            [7003, 7005, 7011],
        ][pattern_variant]
    if index_mod == 6:
        return [
            [7001, 7002, 7003, 7004, 7005],
            [7002, 7003, 7004, 7005, 7006],
            [7003, 7004, 7005, 7006, 7007],
            [7004, 7005, 7006, 7007, 7009],
            [7005, 7006, 7007, 7009, 7010],
            [7006, 7007, 7009, 7010, 7011],
        ][pattern_variant]
    if by_variant == 8:
        return [[7002, 7008], [7004, 7008], [7006, 7008], [7009, 7008], [7011, 7008], [7001, 7008]][pattern_variant]
    if by_variant == 9:
        return [[7005, 7006], [7007, 7009], [7010, 7011], [7001, 7004], [7002, 7006], [7003, 7009]][pattern_variant]
    if by_variant == 10:
        return [
            [7001, 7003, 7007],
            [7002, 7004, 7009],
            [7005, 7010, 7011],
            [7001, 7006, 7009],
            [7002, 7007, 7010],
            [7003, 7005, 7011],
        ][pattern_variant]
    return []


def enrolled_courses_for(index: int, pattern_variant: int) -> list[int]:
    index_mod = (index - 1) % 12
    if index_mod == 0:
        return [7009 + (pattern_variant % 3)]
    if index_mod == 1:
        return [7007 + (pattern_variant % 5)]
    if index_mod == 2:
        return [7009 + (pattern_variant % 3), 7012]
    if index_mod == 3:
        return [7005 + (pattern_variant % 5)]
    if index_mod == 4:
        return [7009 + (pattern_variant % 3)]
    if index_mod == 5:
        return [7004 + (pattern_variant % 6)]
    if index_mod == 6:
        return [7009 + (pattern_variant % 3), 7012]
    if index_mod == 7:
        return [7009 + (pattern_variant % 3)]
    if index_mod == 8:
        return [7010 + (pattern_variant % 2)]
    if index_mod == 9:
        return [7009, 7010, 7011, 7012]
    if index_mod == 10:
        return [7006 + (pattern_variant % 6)]
    return []


def attended_event_count_for(index: int, pattern_variant: int) -> int:
    if ((index - 1) % 12) == 6:
        return 1 + (pattern_variant % 4)
    return EVENT_COUNT_PATTERNS[(index - 1) % len(EVENT_COUNT_PATTERNS)]


def build_participant(index: int) -> Participant:
    first_name, last_name = name_for(index)
    pattern_variant = ((index - 1) // 12) % 6
    passed_courses = passed_courses_for(index, pattern_variant)
    enrolled_courses = enrolled_courses_for(index, pattern_variant)
    attended_event_count = attended_event_count_for(index, pattern_variant)
    passed_ects_total = sum(COURSE_ECTS[course_id] for course_id in passed_courses)
    completion_requirements_met = passed_ects_total >= 12.5 and attended_event_count >= 1
    if passed_courses:
        motivation_rating = "INVITE"
    else:
        application_bucket = index % 10
        if application_bucket in (8, 9):
            motivation_rating = "DECLINE"
        elif application_bucket in (5, 6, 7):
            motivation_rating = "REVIEW"
        else:
            motivation_rating = "UNRATED"

    if motivation_rating == "DECLINE":
        status = "REJECTED"
    elif motivation_rating in ("REVIEW", "UNRATED"):
        status = "APPLIED"
    elif completion_requirements_met:
        status = "COMPLETED"
    elif index % 60 == 0:
        status = "INVITED"
    elif index % 37 == 0:
        status = "CANCELLED"
    else:
        status = "CONFIRMED"
    email = f"{first_name}.{last_name}.ml{index}@example.com".lower()
    return Participant(
        index=index,
        user_id=user_id_for(index),
        first_name=first_name,
        last_name=last_name,
        email=email,
        pattern_variant=pattern_variant,
        passed_courses=passed_courses,
        enrolled_courses=enrolled_courses,
        attended_event_count=attended_event_count,
        status=status,
        motivation_rating=motivation_rating,
        completion_requirements_met=completion_requirements_met,
    )


def static_sql(user_count: int) -> str:
    return f"""{BEGIN_MARKER}
-- Generated by backend/seeds/utils/generate_ml_degree_seed.py --users {user_count}
INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, "achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", "contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", "endTime", "startTime", published, "externalRegistrationLink", "registrationType") VALUES
  (7000, 'Machine Learning Degree', 'APPLICANTS_INVITED', '12.5', 'Production-like seed degree for performance checks of degree participations.', 'EN', '2026-04-30', '0', true, false, 2, 'NONE', NULL, '2025-11-13 11:00:00+00', '2026-04-20 05:00:00+00', 2, 'Machine Learning portfolio', 'Certificate requirements', 'Complete a realistic mix of ML courses and events.', 'Used for local performance testing.', 'Build, evaluate, and deploy machine learning systems.', 'https://chat.opencampus.sh', 350, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7001, 'Data Science and Machine Learning Foundations', 'APPLICANTS_INVITED', '5', 'Core data science and machine learning foundations.', 'EN', '2024-03-31', '0', true, true, 2, 'TUESDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 12:00:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7002, 'Machine Learning with TensorFlow', 'APPLICANTS_INVITED', '5', 'Applied neural network modeling with TensorFlow.', 'EN', '2024-03-31', '0', true, true, 2, 'WEDNESDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 12:00:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7003, 'Intermediate Machine Learning', 'APPLICANTS_INVITED', '5', 'Model selection, feature engineering, and validation.', 'EN', '2024-09-30', '0', true, true, 2, 'THURSDAY', NULL, '2024-08-15 10:00:00+00', '2025-03-25 12:00:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7004, 'From LLMs to AI Agents', 'APPLICANTS_INVITED', '5', 'Design patterns for agentic AI systems.', 'EN', '2025-03-31', '0', true, true, 2, 'MONDAY', NULL, '2025-01-15 10:00:00+00', '2025-11-13 11:30:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 160, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7005, 'Introduction to Data Science & Machine Learning', 'APPLICANTS_INVITED', '5', 'English-language introduction to ML workflows.', 'EN', '2025-09-30', '0', true, true, 2, 'TUESDAY', NULL, '2025-08-15 10:00:00+00', '2026-03-25 07:50:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 160, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7006, 'Advanced Time Series Prediction', 'APPLICANTS_INVITED', '5', 'Forecasting with statistical and neural models.', 'EN', '2025-03-31', '0', true, true, 2, 'WEDNESDAY', NULL, '2025-01-15 10:00:00+00', '2025-11-13 11:20:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7007, 'Scientific Machine Learning', 'APPLICANTS_INVITED', '5', 'Scientific computing with ML methods.', 'EN', '2025-09-30', '0', true, true, 2, 'THURSDAY', NULL, '2025-08-15 10:00:00+00', '2026-03-25 07:50:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7008, 'Fine-Tuning and Deployment of Large Language Models', 'APPLICANTS_INVITED', '2.5', 'Hands-on LLM adaptation and deployment.', 'EN', '2024-03-31', '0', true, true, 2, 'FRIDAY', NULL, '2024-01-15 10:00:00+00', '2024-09-04 13:13:00+00', 4, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7009, 'Applied Machine Learning', 'APPLICANTS_INVITED', '5', 'Current applied ML project course.', 'EN', '2026-04-30', '0', true, true, 2, 'MONDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7010, 'Introduction to Deep Reinforcement Learning', 'APPLICANTS_INVITED', '5', 'Foundations of reinforcement learning.', 'EN', '2026-04-30', '0', true, true, 2, 'TUESDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7011, 'Causal Inference and ML', 'APPLICANTS_INVITED', '5', 'Causal reasoning for machine learning systems.', 'EN', '2026-04-30', '0', true, true, 2, 'WEDNESDAY', NULL, '2026-03-01 10:00:00+00', '2026-04-20 05:00:00+00', 6, NULL, NULL, NULL, NULL, NULL, NULL, 180, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7012, 'AI Builder''s Arena', 'APPLICANTS_INVITED', 'NONE', 'Experimental AI prototyping format.', 'EN', '2024-09-30', '0', false, true, 2, 'THURSDAY', NULL, '2024-08-15 10:00:00+00', '2024-11-13 11:20:00+00', 5, NULL, NULL, NULL, NULL, NULL, NULL, 120, '18:00:00', '16:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7101, 'Coding.Waterkant 2021', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2021-09-01', '0', false, true, 0, 'NONE', NULL, '2021-08-01 10:00:00+00', '2021-09-04 12:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7102, 'Coding.Waterkant 2024', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2024-09-01', '0', false, true, 0, 'NONE', NULL, '2024-08-01 10:00:00+00', '2024-09-04 12:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7103, 'Coding.Waterkant 2025', 'APPLICANTS_INVITED', 'NONE', 'Machine-learning community event.', 'EN', '2025-09-01', '0', false, true, 0, 'NONE', NULL, '2025-08-01 10:00:00+00', '2025-11-13 11:26:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 350, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7104, 'ML Ops Community Night', 'APPLICANTS_INVITED', 'NONE', 'Evening event for model deployment practices.', 'EN', '2025-10-01', '0', false, true, 0, 'NONE', NULL, '2025-09-01 10:00:00+00', '2025-11-13 11:27:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 250, '21:00:00', '18:00:00', true, NULL, 'APPROVAL_WITH_INPUT'),
  (7105, 'Responsible AI Lab Day', 'APPLICANTS_INVITED', 'NONE', 'Hands-on event for responsible AI methods.', 'EN', '2026-03-01', '0', false, true, 0, 'NONE', NULL, '2026-02-01 10:00:00+00', '2026-04-20 05:00:00+00', 3, NULL, NULL, NULL, NULL, NULL, NULL, 250, '18:00:00', '10:00:00', true, NULL, 'APPROVAL_WITH_INPUT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at)
SELECT 7000 + row_number() OVER (), linked_course.course_id, 7000, '2026-04-20 05:00:00+00'::timestamptz, '2026-04-20 05:00:00+00'::timestamptz
FROM unnest(ARRAY[7001, 7002, 7003, 7004, 7005, 7006, 7007, 7008, 7009, 7010, 7011, 7012, 7101, 7102, 7103, 7104, 7105]) AS linked_course(course_id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public."Session" (id, title, description, "startDateTime", "endDateTime", "courseId", created_at, updated_at, "attendanceData", questionaire_sent)
SELECT 71000 + event_series.event_index,
       'Attendance checkpoint',
       'Seeded event attendance session',
       ('2025-10-01 10:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '30 days')),
       ('2025-10-01 18:00:00+00'::timestamptz + ((event_series.event_index - 1) * interval '30 days')),
       7100 + event_series.event_index,
       '2026-04-20 05:00:00+00'::timestamptz,
       '2026-04-20 05:00:00+00'::timestamptz,
       NULL,
       true
FROM generate_series(1, 5) AS event_series(event_index)
ON CONFLICT (id) DO NOTHING;
"""


def build_sql(user_count: int) -> str:
    participants = [build_participant(index) for index in range(1, user_count + 1)]

    user_rows = []
    enrollment_rows = []
    attendance_rows = []

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
                f"ml-degree-{index}",
                timestamp_plus("2025-11-13 11:00:00+00", index, "minute"),
                timestamp_plus("2026-04-20 05:00:00+00", index, "second"),
                str(200000 + index),
                "ACTIVE",
                10000 + index,
                None,
                "EMPLOYED_PART_TIME" if index % 5 == 0 else "UNIVERSITY_STUDENT",
                None,
                None,
            )
        )

        enrollment_rows.append(
            (
                700000 + (index * 10000),
                DEGREE_ID,
                participant.user_id,
                participant.status,
                "I want to complete the Machine Learning Degree and document my learning path.",
                participant.motivation_rating,
                f"{participant.user_id}/{DEGREE_ID}/achievement_certificate.pdf"
                if participant.status == "COMPLETED" and participant.completion_requirements_met
                else None,
                None,
                timestamp_plus("2025-11-13 11:00:00+00", index, "minute"),
                timestamp_plus("2026-04-20 05:00:00+00", index, "second"),
                date_value("2026-05-01") if participant.status == "INVITED" else None,
            )
        )

        for course_id in participant.passed_courses:
            enrollment_rows.append(
                (
                    701000 + (index * 10000) + course_id - 7000,
                    course_id,
                    participant.user_id,
                    "COMPLETED",
                    "Seeded passed course for degree performance checks.",
                    "UNRATED",
                    f"{participant.user_id}/{course_id}/achievement_certificate.pdf",
                    f"{participant.user_id}/{course_id}/attendance_certificate.pdf",
                    timestamp_plus("2024-09-04 13:00:00+00", (course_id - 7000) * 10, "day"),
                    timestamp_plus("2025-11-13 11:20:00+00", index, "second"),
                    None,
                )
            )

        for course_id in participant.enrolled_courses:
            if course_id in participant.passed_courses:
                continue
            enrollment_rows.append(
                (
                    702000 + (index * 10000) + course_id - 7000,
                    course_id,
                    participant.user_id,
                    "CONFIRMED",
                    "Seeded current enrollment for degree performance checks.",
                    "UNRATED",
                    None,
                    None,
                    timestamp_plus("2026-04-20 05:00:00+00", index, "second"),
                    timestamp_plus("2026-04-20 05:00:00+00", index, "second"),
                    None,
                )
            )

        for event_index in range(1, participant.attended_event_count + 1):
            event_position = ((index - 1) + participant.pattern_variant + ((event_index - 1) * 2)) % len(EVENT_COURSE_IDS) + 1
            course_id = EVENT_COURSE_IDS[event_position - 1]
            enrollment_rows.append(
                (
                    703000 + (index * 10000) + event_index,
                    course_id,
                    participant.user_id,
                    "COMPLETED",
                    "Seeded attended event for degree performance checks.",
                    "UNRATED",
                    None,
                    f"{participant.user_id}/{course_id}/attendance_certificate.pdf",
                    timestamp_plus("2025-11-13 11:26:00+00", event_position, "minute"),
                    timestamp_plus("2025-11-13 11:26:00+00", index, "second"),
                    None,
                )
            )
            attendance_rows.append(
                (
                    700000 + (index * 10) + event_index,
                    71000 + event_position,
                    participant.user_id,
                    "ATTENDED",
                    timestamp_plus("2025-11-13 11:26:00+00", index, "second"),
                    timestamp_plus("2025-11-13 11:26:00+00", index, "second"),
                    participant.email,
                    "INSTRUCTOR",
                    timestamp_plus("2025-10-01 10:00:00+00", (event_position - 1) * 30, "day"),
                    timestamp_plus("2025-10-01 18:00:00+00", (event_position - 1) * 30, "day"),
                    28800,
                    0,
                )
            )

    sql = static_sql(user_count)
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
    sql += f"{END_MARKER}\n"
    return sql


def replace_generated_block(seed_file: Path, generated_sql: str) -> None:
    original = seed_file.read_text()
    if BEGIN_MARKER in original and END_MARKER in original:
        start = original.index(BEGIN_MARKER)
        end = original.index(END_MARKER, start) + len(END_MARKER)
        if end < len(original) and original[end] == "\n":
            end += 1
        updated = original[:start] + generated_sql + original[end:]
    else:
        start = original.index("DO $$")
        end = original.index("END $$;", start) + len("END $$;")
        if end < len(original) and original[end] == "\n":
            end += 1
        updated = original[:start] + generated_sql + original[end:]
    seed_file.write_text(updated)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate ML degree seed SQL.")
    parser.add_argument("--users", type=int, default=DEFAULT_USER_COUNT)
    parser.add_argument(
        "--seed-file",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "default" / "initial_seeds.sql",
    )
    parser.add_argument("--print-only", action="store_true")
    args = parser.parse_args()

    if args.users < 1:
        parser.error("--users must be at least 1")

    generated_sql = build_sql(args.users)
    if args.print_only:
        print(generated_sql, end="")
        return
    replace_generated_block(args.seed_file, generated_sql)


if __name__ == "__main__":
    main()
