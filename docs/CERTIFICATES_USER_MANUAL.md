# Certificates — User Manual

This manual covers how EduHub produces certificates: the end-to-end creation
flow, the two certificate variants, and — most importantly — **where the HTML
templates and the background images are configured**.

It is written for two audiences:

- **Administrators** — configure the HTML templates and background images, and
  understand how a certificate resolves its template.
- **Instructors** — trigger certificate generation for the participants of a
  course.

Participants only ever *download* certificates, so there is no participant-facing
configuration in this document.

> **Coming soon:** template HTML is currently authored directly in the database
> (see §6). A dedicated admin page for **creating and editing certificate
> template HTML** in the browser is planned — once it ships, step §6 will be
> replaced by "open the template, edit, save". The image upload and the template
> *selection* dropdowns described below already exist today.

---

## 1. Concepts and vocabulary

- **Certificate** — a PDF generated for one participant in one course. It is
  rendered from an **HTML template** drawn on top of a **background image**, then
  stored and linked from the participant's course enrollment.
- **HTML template** (`CertificateTemplate`) — a reusable, named Jinja2 HTML
  document. This is the *text and layout* of the certificate. One row per
  distinct template; referenced by FK from whichever entity owns the variant.
- **Background image** — the PNG/JPG/PDF that sits *behind* the text (logo,
  border, signatures). Set as a URL on the **Program**, exposed in the template
  as the `{{ template }}` variable. This is **separate** from the HTML template.
- **Certificate variant** — one of three flavours: *attendance*, *achievement*,
  or *degree* (degree is a special case of achievement).

The key thing to internalise: **a certificate = HTML template + background
image + per-participant data.** The HTML and the image are configured in
different places, and either can be overridden independently.

---

## 2. The two certificate variants

| Variant | Who gets it | What it certifies |
|---|---|---|
| **Attendance** | Course participants who attended enough sessions | Participation / "Teilnahmenachweis" |
| **Achievement** | Participants who completed a project in the course | Performance / "Leistungszertifikat" |

**Degrees are not a third variant.** A degree certificate is just an achievement
certificate whose **course** carries its own HTML template directly on
`Course.achievementCertificateTemplateId` (each degree's wording is unique). No
special detection by program type or short title happens at render time — the
normal achievement resolution chain (§5) walks straight to the course-level
template.

---

## 3. The end-to-end creation flow

```text
            ┌─────────────────────────────────────────────────────────────┐
            │ ADMIN (one-time setup, per program)                          │
            │  • upload background image  → Program.*CertificateTemplateURL │
            │  • pick HTML template       → *.certificateTemplateId FK      │
            └─────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
   INSTRUCTOR, in Manage Course → Participations tab:
     selects participants → clicks "Generate attendance / achievement certificates"
                                       │
                                       ▼  (createCertificates mutation,
                                       │   certificateType = "attendance" | "achievement")
            ┌─────────────────────────────────────────────────────────────┐
            │ SERVER (Python certificate function)                         │
            │  1. resolve HTML template  (the chain in §5)                 │
            │  2. resolve background image (Program URL, §4)               │
            │  3. fill per-participant data (full_name, ECTS, …)           │
            │  4. render Jinja2 HTML → PDF (xhtml2pdf)                     │
            │  5. upload PDF to Google Cloud Storage                       │
            │  6. write storage path onto CourseEnrollment.*CertificateURL │
            └─────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
        PARTICIPANT: sees and downloads the PDF under "My Certificates".
```

Notes:

- Generation is **batch, per course**: the instructor selects users on the
  Participations tab and runs it for the whole selection.
- The generated PDF is stored in GCS at
  `{userId}/{courseId}/{attendance|achievement}_certificate.pdf`. The **storage
  path / blob name** (not the signed upload URL) is persisted on
  `CourseEnrollment.attendanceCertificateURL` / `achievementCertificateURL`.
  The upload URL is only written to the server log.
- Re-running generation overwrites the existing PDF for that user + course.

---

## 4. Where the **background image** is set

The background image is the visual backdrop (`{{ template }}` in the HTML). It is
uploaded **per program** and is unchanged by the recent template restructure.

**Where:** `Manage Programs` → expand a program → **Certificate Templates** card.
There are two upload fields:

- **Proof of participation** → stored on `Program.attendanceCertificateTemplateURL`
- **Performance certificate** → stored on `Program.achievementCertificateTemplateURL`

Accepted formats: `.pdf, .jpg, .jpeg, .png` (max 10 MB). Degree courses use
the *achievement* image of the program they live in.

> These image fields are about the **picture behind the text**, not the text
> itself. Uploading a new image never changes which HTML template is used.

---

## 5. Where the **HTML template** is set, and how it resolves

HTML templates live in the `CertificateTemplate` catalog (each has a unique
`name` and an `html` body). Owners reference a template by FK, and at render time
the server walks a **precedence chain**, most-specific first:

### Attendance

```text
Course.attendanceCertificateTemplateId          (per-course override)
  ↓ if null
Program.attendanceCertificateTemplateId          (program default)
```

### Achievement (project-based)

```text
Course.achievementCertificateTemplateId          (per-course override)
  ↓ if null
ProjectType.certificateTemplateId                 (default for the completed
                                                   project's type)
```

### Degree

A degree certificate is an achievement certificate; the resolution chain above
applies. In practice it always resolves at the first step because each degree
**course** has its own HTML on `Course.achievementCertificateTemplateId`.

Its *content* differs from a project-based achievement certificate: instead of
learning goals and a practical project it lists the degree's completed
components — the member courses (`CourseDegree`) the participant passed, followed
by the degree's events (see §7 for the variables).

### 5.3 Degree requirements (when a degree certificate may be issued)

Each degree course carries its own completion thresholds:

| Field | Meaning |
|---|---|
| `Course.requiredEcts` | Minimum ECTS collected from **passed** member courses (those with an achievement certificate) |
| `Course.requiredEventCount` | Minimum number of the degree's **events** the participant is enrolled in (enrollment counts; no certificate needed) |

Both are edited in `Manage Degrees` → expand a degree row → **"Degree
requirements"**. An empty field means that requirement is not checked.

`requiredEcts` is the *only* ECTS number a degree has: a degree does not award ECTS
of its own, so there is no separate ECTS field on a degree, the public info panel
shows the required amount, and both `{{ ECTS }}` and `{{ required_ects_display }}`
render it on the certificate. A degree whose requirement is not set therefore prints
an empty ECTS value — a deliberate signal that the field still has to be filled in.

The "possible certificates" toggles and the max-missed-sessions field are **not
shown** for a degree: a degree has no sessions, and its certificate flags are set
automatically — `achievementCertificatePossible = true`,
`attendanceCertificatePossible = false` — by a database trigger on insert plus a
one-off backfill (migration `1786463520002_degree_course_certificate_defaults`).
Those flags are not cosmetic: with both false, a participant sees neither their
completed degree components nor their certificate download on the degree page. Generating
a degree certificate for a participant below a configured threshold is refused
with `DEGREE_REQUIREMENTS_NOT_MET`, and the error names the shortfall (e.g.
*"10.0 of 12.5 ECTS, 0 of 1 events"*). The numbers are exactly the ECTS and event
counts shown in the degree's **Degree Participations** tab.

### 5.1 Where admins set these today

| Scope | Field | UI location | Status |
|---|---|---|---|
| **App-level default per program type (attendance)** | `ProgramType.defaultAttendanceCertificateTemplateId` | `Manage App Settings` → "Default attendance certificate templates by program type" — one dropdown per ProgramType (`COURSES`, `EVENTS`, `DEGREES`, …) | **Available now** |
| **Program (attendance)** | `Program.attendanceCertificateTemplateId` | `Manage Programs` → program → Certificate Templates card → "HTML template" dropdown | **Available now** |
| **Course (attendance / achievement override)** | `Course.{attendance,achievement}CertificateTemplateId` | — | DB-only for now |
| **Project type (achievement default)** | `ProjectType.certificateTemplateId` | — | DB-only for now |

### 5.2 The per-program-type attendance default and the snapshot rule

To avoid configuring every program by hand, the app holds **one default
attendance template per `ProgramType`** (`COURSES`, `EVENTS`, `DEGREES`, …).
This is configured in `Manage App Settings` and behaves as a *snapshot*, not a
live link:

- **On program creation** — a database trigger reads the new program's `type`,
  looks up the corresponding `ProgramType.defaultAttendanceCertificateTemplateId`,
  and copies its value into the new program's
  `attendanceCertificateTemplateId` (unless one was set explicitly).
- **In the program dropdown** — choosing **"Apply current app-level default"**
  copies the *current* default for that program's type into the program.

In both cases the program stores a concrete template id. **Changing a
ProgramType default later does not retroactively change existing programs** —
past programs keep whatever template they were given. This is intentional: a
new default should only affect programs created (or explicitly re-pointed) after
the change.

---

## 6. Authoring / editing template HTML (current process)

Today the HTML bodies in `CertificateTemplate` are managed directly in the
database (via seeds or SQL `INSERT`/`UPDATE`). A template row is just:

- `name` — unique, human-readable (e.g. *"Default achievement certificate"*,
  *"Degree certificate — Digital Innovation"*).
- `html` — a Jinja2 document. The background image is referenced as
  `{{ template }}`; the other variables available depend on the variant (§7).

Once a template row exists, it appears in the selection dropdowns described in
§5.1 and can be assigned to any program/course/project type.

> **Coming soon:** a dedicated admin page to **create and edit certificate
> template HTML in the browser** is planned. It will let admins add a new named
> template, edit its HTML, and preview it — removing the need to touch the
> database for routine template changes. The selection dropdowns and image
> uploads in this manual will stay the same; only the authoring step in this
> section will move into the UI.

---

## 7. Template variables (Jinja2)

The server fills different variables per variant. Common to all:
`{{ template }}` (background image), `{{ full_name }}`, `{{ course_name }}`,
`{{ semester }}` (the program title).

| Variant | Additional variables |
|---|---|
| **Attendance** | `{{ event_entries }}` (list of attended session titles), `{{ ECTS }}` |
| **Achievement** (project-based) | `{{ ECTS }}`, `{{ learningGoalsList }}`, `{{ praxisprojekt }}` (the completed project title) |
| **Degree** | `{{ successful_participations }}` (all degree components, passed courses first, then events), `{{ passed_participations }}`, `{{ event_participations }}`, `{{ ECTS }}` (same value as `required_ects_display`, kept under the legacy name), plus the degree's requirements and what the participant achieved: `{{ required_ects_display }}`, `{{ required_event_count }}`, `{{ achieved_ects_display }}`, `{{ attended_event_count }}` |

A degree template should print `{{ required_ects_display }}` / `{{ required_event_count }}`
rather than hard-coding numbers, so the wording follows the thresholds configured
on the degree course (§5.3).

Names are rendered upper-cased. ECTS formatting is handled server-side.

---

## 8. Quick reference — "where do I change X?"

| I want to… | Go to | Field |
|---|---|---|
| Change the **logo/border/background** of a program's certificates | Manage Programs → program → Certificate Templates card → upload | `Program.{attendance,achievement}CertificateTemplateURL` |
| Change **which HTML template** a program's attendance certificates use | Manage Programs → program → Certificate Templates card → "HTML template" dropdown | `Program.attendanceCertificateTemplateId` |
| Set the **default** attendance template new programs inherit, **per program type** | Manage App Settings → "Default attendance certificate templates by program type" | `ProgramType.defaultAttendanceCertificateTemplateId` |
| Override a **single course's** template | (DB for now) | `Course.{attendance,achievement}CertificateTemplateId` |
| Change the **default achievement template per project type** | (DB for now) | `ProjectType.certificateTemplateId` |
| Set a **degree's** unique wording | (DB for now) | the degree `Course.achievementCertificateTemplateId` |
| Change **how much a degree requires** (ECTS / events) | Manage Degrees → expand the degree → "Degree requirements" | `Course.requiredEcts`, `Course.requiredEventCount` |
| **Edit the HTML** of a template | (DB for now; dedicated page coming soon) | `CertificateTemplate.html` |
| **Generate** certificates | Manage Course → Participations tab → generate buttons | — |

---

## 9. Troubleshooting

- **"Template image not found" / generation fails for attendance or achievement**
  — the program has no background image uploaded for that variant (§4). Upload
  the corresponding image on the program.
- **"No template found" / "certificate template not found"** — no HTML template
  resolves through the chain in §5. Check, in order: the course override, then
  the program default (attendance) or the project type default (achievement). For
  a degree course, confirm its `achievementCertificateTemplateId` is set.
- **"The degree requirements are not met yet"** — the participant is below
  `Course.requiredEcts` or `Course.requiredEventCount` for that degree (§5.3). The
  message names the shortfall. Either the missing component certificates have not
  been generated yet (only *passed* member courses count towards ECTS), or the
  degree's thresholds need adjusting on the degree row.
- **A new program got the wrong / no attendance template** — it inherited
  whatever the **`ProgramType` default for its `type`** was at creation time
  (§5.2). If a ProgramType has no default set, new programs of that type start
  with `attendanceCertificateTemplateId = NULL`. Pick the right template in the
  program dropdown; this only affects that program.
- **Changing a ProgramType default didn't update existing programs** — that is
  by design (§5.2). Re-point each program explicitly via its dropdown.
- **Achievement certificate but the participant has no completed project** —
  achievement certificates require a `COMPLETED` project authored by the user in
  that course; without one there is nothing to certify.
