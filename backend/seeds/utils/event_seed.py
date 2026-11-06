"""Events covering every registration option, and the organizer and locations
of the Machine Learning Degree.

Called by ``generate_ml_degree_seed.py`` through ``course_attendance_seed.py``.
The bracket at the end of each event title names its test case, so events are
easy to find while testing, e.g. "[Bezahlt · direkt]" or "[Läuft · Bewerbung]".
Dates of upcoming and running events are offsets in days from the seeding day;
past events have fixed dates.
"""

from __future__ import annotations

import random
import zlib
from dataclasses import dataclass, field

from course_attendance_seed import VENUES, CourseParticipant, CourseSchedule, SqlRaw, values_sql

EVENTS_PROGRAM_ID = 3
ARCHIVE_PROGRAM_ID = 10  # past events, unpublished (inserted by generate_ml_degree_seed.py)
EVENTS_ORGANIZATION_ID = 0
DEGREE_ID = 7000
TEAM_USER_ID = "c0de0000-0000-0000-0000-000000007000"
DEV_USER = CourseParticipant("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "User", "User", "user@example.com", "")
VAT_RATE = 0.19
SEEDED_AT = "2026-04-20 05:00:00+00"

GUEST_NAMES = [
    ("Birte", "Hansen"), ("Ole", "Petersen"), ("Frauke", "Jensen"), ("Hauke", "Carstensen"),
    ("Insa", "Thomsen"), ("Momme", "Nissen"), ("Telse", "Lorenzen"), ("Jannik", "Ketelsen"),
    ("Wiebke", "Christiansen"), ("Sönke", "Paulsen"), ("Merle", "Jacobsen"), ("Fiete", "Andresen"),
]


@dataclass(frozen=True)
class EventDef:
    course_id: int
    title: str
    tagline: str
    description: str
    registration_type: str
    days: tuple[tuple[object, int, int], ...]
    application_end: object  # Berlin date string or day offset from the seeding day
    locations: tuple[str, ...] = ("KIEL",)
    base_price: int = 0  # cents
    guests: bool = False
    max_participants: int | None = None
    show_places: bool = False
    external_link: str | None = None
    button_de: str | None = None
    button_en: str | None = None
    in_degree: bool = False
    # Enrollments per status, drawn from the generated participants.
    statuses: dict[str, int] = field(default_factory=dict)
    guest_count: int = 0
    dev_user_status: str | None = None
    # Paid events: how the CONFIRMED enrollments paid ("PAID" card, "ISSUED" SEPA pending).
    sepa_pending: int = 0
    refunded: int = 0
    # A course session published as an event: the database copies the session,
    # its locations and speakers into the event and forces DIRECT_CONFIRMATION.
    source_session_id: int | None = None


EVENTS = [
    # --- Upcoming, registration open -----------------------------------------
    EventDef(
        7201, "KI-Stammtisch Kiel [Direkt · kostenlos]",
        "Lockerer Austausch über KI-Projekte bei einem Getränk.",
        "Ein Abend für alle, die mit KI arbeiten oder es vorhaben. Kurze Lightning Talks, danach Zeit zum Netzwerken.",
        "DIRECT_CONFIRMATION", ((14, 18, 21),), 13,
        max_participants=60, show_places=True, statuses={"CONFIRMED": 18}, dev_user_status="CONFIRMED",
    ),
    EventDef(
        7202, "Data Science Meetup Kiel [Direkt · mit Gästen]",
        "Zwei Talks aus der Praxis – Anmeldung auch ohne Account.",
        "Gäste können sich ohne EduHub-Account mit ihrer E-Mail-Adresse anmelden.",
        "DIRECT_CONFIRMATION", ((7, 18, 20),), 6,
        guests=True, max_participants=80, statuses={"CONFIRMED": 15}, guest_count=6,
    ),
    EventDef(
        7203, "Prototyping-Workshop [Direkt mit Angaben · mit Gästen]",
        "In drei Stunden vom Problem zum klickbaren Prototyp.",
        "Bei der Anmeldung fragen wir kurz nach Deinem Vorwissen, damit wir die Gruppen passend zusammenstellen.",
        "DIRECT_WITH_INPUT", ((10, 14, 17),), 9,
        guests=True, max_participants=30, show_places=True, statuses={"CONFIRMED": 10}, guest_count=4,
    ),
    EventDef(
        7204, "Prompt Engineering Masterclass [Bezahlt · direkt]",
        "Ein Tag intensives Training für bessere Prompts und Agenten.",
        "Die Teilnahme kostet 49 € inkl. MwSt. Nach der Zahlung ist Dein Platz sicher.",
        "DIRECT_CONFIRMATION_AND_PAYMENT", ((21, 10, 16),), 19,
        base_price=4900, max_participants=25, show_places=True,
        statuses={"CONFIRMED": 14, "APPLIED": 3}, dev_user_status="CONFIRMED", sepa_pending=1,
        button_de="Ticket kaufen", button_en="Buy ticket",
    ),
    EventDef(
        7205, "Waterkant Festival Tagesticket [Bezahlt · mit Angaben]",
        "Ein Tag Festival mit Talks, Workshops und Ausstellung.",
        "Bei der Anmeldung wählst Du Deine Workshop-Präferenzen aus. Das Ticket kostet 25 € inkl. MwSt.",
        "DIRECT_WITH_INPUT_AND_PAYMENT", ((28, 9, 18),), 26,
        base_price=2500, max_participants=200, statuses={"CONFIRMED": 9, "APPLIED": 2},
        button_de="Ticket sichern", button_en="Get ticket",
    ),
    EventDef(
        7206, "Coding Camp 2026 [Bewerbung]",
        "Drei Tage Machine Learning an echten Problemen – mit Bewerbung.",
        "Die Plätze sind begrenzt. Erzähl uns in Deiner Bewerbung, woran Du arbeiten möchtest.",
        "APPROVAL_WITH_INPUT", ((35, 10, 18), (36, 10, 18), (37, 10, 16)), 21,
        max_participants=40, in_degree=True,
        statuses={"APPLIED": 20, "INVITED": 6, "CONFIRMED": 8, "REJECTED": 4}, dev_user_status="APPLIED",
    ),
    EventDef(
        7207, "Waterkant Festival 2026 [Externe Anmeldung]",
        "Das Festival für Innovation und Gründung an der Kieler Förde.",
        "Die Anmeldung läuft über die Website des Festivals.",
        "EXTERNAL_REGISTRATION", ((45, 10, 20), (46, 10, 20)), 44,
        external_link="https://example.com/waterkant-festival",
        button_de="Zur Festival-Anmeldung", button_en="Register on the festival website",
    ),
    EventDef(
        7208, "AI Founders Breakfast [Ausgebucht · Warteliste]",
        "Frühstück mit Gründer:innen aus der KI-Szene – nur 12 Plätze.",
        "Alle Plätze sind vergeben. Trag Dich in die Warteliste ein, wir melden uns, sobald etwas frei wird.",
        "DIRECT_CONFIRMATION", ((9, 8, 10),), 8,
        max_participants=12, show_places=True, statuses={"CONFIRMED": 12, "WAITLIST": 4},
    ),
    # --- Running ------------------------------------------------------------
    EventDef(
        7209, "Prototyping Week [Läuft · Bewerbung]",
        "Eine Woche lang im Team einen KI-Prototyp bauen.",
        "Die Prototyping Week läuft gerade. Bewerbungen sind geschlossen.",
        "APPROVAL_WITH_INPUT", ((-2, 9, 17), (-1, 9, 17), (0, 9, 17), (1, 9, 17), (2, 9, 15)), -10,
        locations=("KIEL", "ONLINE"), max_participants=30, in_degree=True,
        statuses={"CONFIRMED": 24, "REJECTED": 5},
    ),
    EventDef(
        7210, "Coding.Waterkant Meetup-Reihe [Läuft · Direkt · mit Gästen]",
        "Monatliches Meetup der Coding.Waterkant Community – vor Ort und online.",
        "Melde Dich einmal an und sei bei allen Terminen der Reihe dabei.",
        "DIRECT_CONFIRMATION", ((-56, 18, 20), (-28, 18, 20), (14, 18, 20), (42, 18, 20)), 40,
        locations=("KIEL", "ONLINE"), guests=True, statuses={"CONFIRMED": 30}, guest_count=5,
        dev_user_status="CONFIRMED",
    ),
    EventDef(
        7215, "Gastvortrag: ML in der Industrie [Öffentliche Session eines Kurses]",
        "Eine Session des Kurses Applied Machine Learning – offen für alle.",
        "Diese Session gehört zum Kurs Applied Machine Learning und ist auch für Externe geöffnet. "
        "Kursteilnehmende sind automatisch dabei und müssen sich nicht anmelden.",
        "DIRECT_CONFIRMATION", (),
        # Registration closes the day before the source session, whatever weekday the seed runs on.
        SqlRaw('SELECT ("startDateTime" AT TIME ZONE \'Europe/Berlin\')::date - 1 FROM public."Session" WHERE id = 72909'),
        guests=True, max_participants=40, show_places=True, statuses={"CONFIRMED": 7}, guest_count=3,
        source_session_id=72909,  # Applied Machine Learning (7009), session 9
    ),
    # --- Past ---------------------------------------------------------------
    EventDef(
        7211, "Coding Camp 2025 [Vergangen · Bewerbung]",
        "Drei Tage Machine Learning an echten Problemen.",
        "Das Coding Camp 2025 ist vorbei. Danke an alle Teams!",
        "APPROVAL_WITH_INPUT", (("2025-09-19", 10, 18), ("2025-09-20", 10, 18), ("2025-09-21", 10, 16)), "2025-08-31",
        max_participants=40, in_degree=True,
        statuses={"COMPLETED": 30, "REJECTED": 5, "CANCELLED": 2}, dev_user_status="COMPLETED",
    ),
    EventDef(
        7212, "Data Science Meetup Juni [Vergangen · Direkt · mit Gästen]",
        "Zwei Talks aus der Praxis.",
        "Das Meetup ist vorbei. Die Folien findest Du im Community-Chat.",
        "DIRECT_CONFIRMATION", (("2025-06-12", 18, 20),), "2025-06-12",
        guests=True, max_participants=80, statuses={"CONFIRMED": 20}, guest_count=6,
    ),
    EventDef(
        7213, "Prompt Engineering Masterclass Frühjahr [Vergangen · Bezahlt]",
        "Ein Tag intensives Training für bessere Prompts.",
        "Die Masterclass ist vorbei.",
        "DIRECT_CONFIRMATION_AND_PAYMENT", (("2026-03-14", 10, 16),), "2026-03-13",
        base_price=4900, max_participants=25, statuses={"CONFIRMED": 12, "CANCELLED": 1}, refunded=1,
    ),
    EventDef(
        7214, "Tech Talk: LLMs in Produktion [Vergangen · Direkt mit Angaben · online]",
        "Online-Talk über Monitoring, Kosten und Evaluierung von LLM-Anwendungen.",
        "Der Talk ist vorbei.",
        "DIRECT_WITH_INPUT", (("2026-02-05", 18, 19),), "2026-02-05",
        locations=("ONLINE",), statuses={"CONFIRMED": 40},
    ),
]


def _rng(*parts: object) -> random.Random:
    return random.Random(zlib.crc32("|".join(str(p) for p in parts).encode()))


def _date(day: object) -> SqlRaw:
    if isinstance(day, SqlRaw):
        return SqlRaw(f"({day})")
    if isinstance(day, str):
        return SqlRaw(f"'{day}'::date")
    return SqlRaw(f"(now() AT TIME ZONE 'Europe/Berlin')::date + {day}")


def _first_day(event: EventDef) -> object:
    return event.days[0][0]


def schedules() -> list[CourseSchedule]:
    return [
        CourseSchedule(e.course_id, e.locations, 0, days=e.days, attend_rate=0.9)
        for e in EVENTS
        if not e.source_session_id  # its session is copied from the course by the database
    ]


@dataclass
class EventSeed:
    sql: str
    participants_by_course: dict[int, list[CourseParticipant]]
    # Events created from a course session; must follow that session and its addresses.
    post_sql: str = ""


SPEAKER_USER_ID = "c0de0000-0000-0000-0000-000000007215"


def _render(course_rows: list, enrollment_rows: list, invoice_rows: list) -> list[str]:
    sql = []
    if course_rows:
        sql.append(
            'INSERT INTO public."Course" (id, title, status, ects, tagline, language, "applicationEnd", cost, '
            '"achievementCertificatePossible", "attendanceCertificatePossible", "maxMissedSessions", "weekDay", "coverImage", '
            'created_at, updated_at, "programId", "headingDescriptionField1", "headingDescriptionField2", '
            '"contentDescriptionField1", "contentDescriptionField2", "learningGoals", "chatLink", "maxParticipants", '
            '"endTime", "startTime", published, "externalRegistrationLink", "registrationType", "basePrice", currency, '
            '"guestRegistrationEnabled", "showAvailablePlaces", "registrationButtonLabelDe", "registrationButtonLabelEn", '
            '"sourceSessionId") VALUES\n  '
            + values_sql(course_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
        )
    if enrollment_rows:
        sql.append(
            'INSERT INTO public."CourseEnrollment" (id, "courseId", "userId", status, "motivationLetter", "motivationRating", '
            'created_at, updated_at, "invitationExpirationDate", "termsAcceptedAt")\n'
            "SELECT v.id, v.course_id, v.user_id::uuid, v.status, v.motivation, v.rating, v.created::timestamptz,\n"
            "       v.updated::timestamptz, v.expires::date, v.terms::timestamptz\n"
            "FROM (VALUES\n  " + values_sql(enrollment_rows) + "\n"
            ") AS v(id, course_id, user_id, status, motivation, rating, created, updated, expires, terms)\n"
            "ON CONFLICT (id) DO NOTHING;\n"
        )
    if invoice_rows:
        sql.append(
            'INSERT INTO public."Invoice" (id, "invoiceNumber", status, "invoiceDate", "organizationId", "userId", '
            '"courseEnrollmentId", "netTotal", "vatTotal", "grossTotal", currency, notes)\n'
            "SELECT v.id, v.number, v.status, v.invoice_date::date, v.organization_id, v.user_id::uuid, v.enrollment_id,\n"
            "       v.net, v.vat, v.gross, v.currency, v.notes\n"
            "FROM (VALUES\n  " + values_sql(invoice_rows) + "\n"
            ") AS v(id, number, status, invoice_date, organization_id, user_id, enrollment_id, net, vat, gross, currency, notes)\n"
            "ON CONFLICT (id) DO NOTHING;\n"
        )
    return sql


def build_event_sql(user_pool: list[CourseParticipant]) -> EventSeed:
    guest_rows, degree_links = [], []
    participants_by_course: dict[int, list[CourseParticipant]] = {}
    invoice_id = 76000

    pre, post = ([], [], []), ([], [], [])
    for event in EVENTS:
        course_rows, enrollment_rows, invoice_rows = post if event.source_session_id else pre
        first_day, (_, start_hour, end_hour) = (
            (_first_day(event), event.days[0]) if event.days else (event.application_end, (None, 16, 18))
        )
        course_rows.append(
            (event.course_id, event.title, "APPLICANTS_INVITED", "NONE", event.tagline, "DE",
             _date(event.application_end), "0", False, True, 0, "NONE", None, SEEDED_AT, SEEDED_AT,
             ARCHIVE_PROGRAM_ID if event.days and all(isinstance(day, str) for day, _, _ in event.days) else EVENTS_PROGRAM_ID,
             "Worum geht es?", None, event.description, None, None,
             "https://chat.opencampus.sh", event.max_participants,
             SqlRaw(f"'{end_hour:02d}:00'::time"), SqlRaw(f"'{start_hour:02d}:00'::time"), True,
             event.external_link, event.registration_type, event.base_price, "EUR", event.guests,
             event.show_places, event.button_de, event.button_en, event.source_session_id)
        )
        if event.in_degree:
            degree_links.append(event.course_id)

        rng = _rng("event", event.course_id)
        pool = list(user_pool)
        rng.shuffle(pool)
        picks: list[tuple[CourseParticipant, str]] = []
        for status, count in event.statuses.items():
            # A small --users run cannot fill every event; take what is there.
            picks += [(pool.pop(), status) for _ in range(min(count, len(pool)))]
        if event.dev_user_status:
            picks.append((DEV_USER, event.dev_user_status))
        for k in range(event.guest_count):
            first, last = GUEST_NAMES[(event.course_id + k) % len(GUEST_NAMES)]
            user_id = f"a0000000-0000-0000-0000-{event.course_id:06d}{k:06d}"
            email = f"{first}.{last}.gast{event.course_id}{k}@example.com".lower().replace("ö", "oe")
            guest_rows.append((user_id, first, last, email, "GUEST", SEEDED_AT, SEEDED_AT))
            picks.append((CourseParticipant(user_id, first, last, email, ""), "REGISTERED"))

        paid_confirmed = 0
        for k, (person, status) in enumerate(picks):
            # Above the generated ML degree enrollments (700000 + index * 10000 + ...).
            # Generated course enrollments use 700000 + index * 10000 + ..., which grows
            # with --users; this range stays clear of it for any realistic user count.
            enrollment_id = 900_000_000 + (event.course_id - 7200) * 1000 + k
            with_input = event.registration_type in ("APPROVAL_WITH_INPUT", "DIRECT_WITH_INPUT", "DIRECT_WITH_INPUT_AND_PAYMENT")
            motivation = (
                "Ich arbeite gerade an einem eigenen ML-Projekt und möchte mich mit anderen austauschen."
                if with_input and status != "REGISTERED" else ""
            )
            # Before the event, but never after the seeding day.
            registered = SqlRaw(f"LEAST({_date(first_day)} - {10 + k % 20}, {_date(0)})")
            enrollment_rows.append(
                (enrollment_id, event.course_id, person.user_id, status, motivation,
                 "INVITE" if status in ("INVITED", "CONFIRMED", "COMPLETED") and event.registration_type == "APPROVAL_WITH_INPUT"
                 else "DECLINE" if status == "REJECTED" else "UNRATED",
                 registered, registered,
                 _date(7) if status == "INVITED" else None,
                 registered if status in ("CONFIRMED", "REGISTERED", "COMPLETED") or event.base_price else None)
            )
            if status in ("CONFIRMED", "REGISTERED", "COMPLETED"):
                participants_by_course.setdefault(event.course_id, []).append(
                    CourseParticipant(person.user_id, person.first_name, person.last_name, person.email, status)
                )
            if not event.base_price or status not in ("CONFIRMED", "CANCELLED"):
                continue
            # Paid with card (PAID), by SEPA still pending (ISSUED), or refunded after cancelling.
            if status == "CANCELLED":
                invoice_status = "REFUNDED" if event.refunded else None
            else:
                invoice_status = "ISSUED" if paid_confirmed < event.sepa_pending else "PAID"
                paid_confirmed += 1
            if invoice_status is None:
                continue
            invoice_id += 1
            net = round(event.base_price / (1 + VAT_RATE))
            invoice_rows.append(
                (invoice_id, f"EDU-SEED-{enrollment_id}", invoice_status, registered, EVENTS_ORGANIZATION_ID,
                 person.user_id, enrollment_id, net, event.base_price - net, event.base_price, "EUR",
                 f"Seeded {invoice_status.lower()} ticket")
            )

    sql = [
        "-- Guests register without an account: a User with status GUEST.\n"
        'INSERT INTO public."User" (id, "firstName", "lastName", email, status, created_at, updated_at) VALUES\n  '
        + values_sql(guest_rows) + "\nON CONFLICT (id) DO NOTHING;\n"
    ]
    sql += _render(*pre)
    sql.append(
        "-- Major events count toward the Machine Learning Degree.\n"
        'INSERT INTO public."CourseDegree" (id, "courseId", "degreeCourseId", created_at, updated_at) VALUES\n  '
        + values_sql([(7050 + i, course_id, DEGREE_ID, SEEDED_AT, SEEDED_AT) for i, course_id in enumerate(degree_links, 1)])
        + "\nON CONFLICT (id) DO NOTHING;\n"
    )
    sql.append(
        '-- The degree is organized by the Coding.Waterkant team (shown as "Team Coding.Waterkant" with its homepage).\n'
        'INSERT INTO public."User" (id, "firstName", "lastName", email, "externalProfile", status, created_at, updated_at) VALUES\n'
        f"  ('{TEAM_USER_ID}', 'Team', 'Coding.Waterkant', 'team@coding.waterkant.example', 'https://coding.waterkant.sh', "
        f"'ACTIVE', '{SEEDED_AT}', '{SEEDED_AT}')\nON CONFLICT (id) DO NOTHING;\n"
        'INSERT INTO public."CourseInstructor" (id, "courseId", "userId", created_at, updated_at) VALUES\n'
        f"  (9200, {DEGREE_ID}, '{TEAM_USER_ID}', '{SEEDED_AT}', '{SEEDED_AT}')\nON CONFLICT (id) DO NOTHING;\n"
        'INSERT INTO public."CourseLocation" (id, "courseId", created_at, updated_at, "locationOption", "defaultSessionAddress", "defaultSessionAddressId") VALUES\n'
        f"  (70001, {DEGREE_ID}, '{SEEDED_AT}', '{SEEDED_AT}', 'KIEL', '{VENUES['starterkitchen'].address}', {VENUES['starterkitchen'].id}),\n"
        f"  (70002, {DEGREE_ID}, '{SEEDED_AT}', '{SEEDED_AT}', 'ONLINE', 'https://zoom.us/j/7000000', NULL)\n"
        "ON CONFLICT (id) DO NOTHING;\n"
    )
    post_sql = [
        "-- A course session published as an event: its speaker is copied into the event as well.\n"
        'INSERT INTO public."User" (id, "firstName", "lastName", email, "externalProfile", status, created_at, updated_at) VALUES\n'
        f"  ('{SPEAKER_USER_ID}', 'Lena', 'Brandt', 'lena.brandt@example.com', 'https://www.linkedin.com', 'ACTIVE', "
        f"'{SEEDED_AT}', '{SEEDED_AT}')\nON CONFLICT (id) DO NOTHING;\n"
        'INSERT INTO public."SessionSpeaker" (id, "sessionId", "userId", created_at, updated_at) VALUES\n'
        + ",\n".join(
            f"  ({9300 + i}, {e.source_session_id}, '{SPEAKER_USER_ID}', '{SEEDED_AT}', '{SEEDED_AT}')"
            for i, e in enumerate((e for e in EVENTS if e.source_session_id), 1)
        )
        + "\nON CONFLICT (id) DO NOTHING;\n"
    ]
    post_sql += _render(*post)
    return EventSeed("\n".join(sql), participants_by_course, "\n".join(post_sql))
