# Projects — User Manual

This manual covers the full project workflow on EduHub: how a project moves
from proposal to publication, the available project types, and how project
documentation (both the instruction PDFs and the author write-up) is handled.

It is written for three audiences:

- **Course participants** — propose, join, and submit projects.
- **Instructors and mentors** — confirm teams, review submissions, rate, and
  publish.
- **Administrators** — manage the project type catalogue, documentation
  instructions, and program/course defaults.

Role-specific guidance is called out inline where the workflow differs.

---

## 1. Concepts and vocabulary

- **Project** — a piece of work produced inside a course. It has one team of
  authors, optional mentors, and (when copied from a template) a parent
  project reference.
- **Author** — a course participant on a project's team. Authors have a
  `participationStatus` of `ACCEPTED`, `REQUESTED`, or `DECLINED`.
- **Mentor** — an instructor-side helper attached to a project. Mentors
  operate independently of the author lifecycle.
- **Proposer** — the user who originally created the project
  (`proposedByUserId`). Usually also the first ACCEPTED author.
- **Template** — a project that lives in PROPOSED status, has no ACCEPTED
  authors, and is intended to be copied by participants who want to claim
  it.
- **Effective submission deadline** — the deadline that actually applies to
  a project, resolved by walking project → course → program → legacy program
  field (see §4).

---

## 2. Project statuses and the submission lifecycle

Project state is held in `Project.status` and is one of six values:

| Status | Meaning |
|---|---|
| `PROPOSED` | Newly created or a still-open template. Team is not finalised; join requests are possible while `acceptingParticipants = true`. |
| `ONGOING` | Team confirmed; project is in flight. `acceptingParticipants` is locked off; no new join requests. |
| `SUBMITTED` | Authors have handed the work in for review. `submittedAt` and `submittedBy` are stamped server-side. |
| `COMPLETED` | Instructor approved the submission. Usually paired with `rating = PASSED`. |
| `INCOMPLETE` | Instructor rejected the submission or the project was abandoned. Usually paired with `rating = FAILED`. |
| `PUBLISHED` | Completed project promoted to a public showcase. Visible to anonymous viewers. |

### 2.1 Allowed transitions

```
                   (author)         (instructor)        (instructor)
PROPOSED ────────► ONGOING ────────► SUBMITTED ────────► COMPLETED ───► PUBLISHED
   │                 ▲                   │                  │
   │ (last accepted  │ (send-back)       │                  │ (reject)
   │  author leaves) └───────────────────┘                  ▼
   ▼                                                     INCOMPLETE
 deleted
```

Key transitions in detail:

- **PROPOSED → ONGOING**: an instructor confirms the team. The project type
  and documentation instruction are chosen here and **locked** after the
  transition; `acceptingParticipants` becomes false; any pending REQUESTED
  rows are declined.
- **ONGOING → SUBMITTED**: an author clicks **Submit** in the **My Project**
  panel. The `set_project_submitted_metadata` trigger stamps `submittedAt`
  on the server; a Hasura permission preset fills `submittedBy` with the
  session user. Clients **cannot** spoof either value.
- **SUBMITTED → ONGOING (send-back)**: an instructor returns the project for
  revision. The trigger clears both `submittedAt` and `submittedBy` so a
  resubmission attributes correctly to whoever resubmits.
- **SUBMITTED → COMPLETED / INCOMPLETE**: instructors approve or reject.
  Approval pairs with `rating = PASSED`, rejection with `rating = FAILED`.
  A separate Rating section lets instructors edit the rating and comment
  without changing status.
- **COMPLETED → PUBLISHED**: instructors promote a finished project to the
  public gallery.
- **Author cleanup**: when the last ACCEPTED author leaves a PROPOSED or
  ONGOING project, the project is auto-deleted by a database trigger.
  DELETE while pending join requests still exist is blocked with a
  `last_accepted_cannot_leave_while_join_requests_pending` error so the
  proposer cannot abandon people they invited.

### 2.2 Who can do what

| Action | Author (`user_access`) | Instructor (`instructor_access`) | Mentor | Admin |
|---|---|---|---|---|
| Propose a project | ✓ (if proposals enabled on course) | ✓ (via **Add project**) | — | ✓ |
| Edit title, tagline, description, artefacts | ✓ (PROPOSED/ONGOING; must be ACCEPTED author) | ✓ | ✓ | ✓ |
| Manage join requests | ✓ (any ACCEPTED author) | ✓ | ✓ | ✓ |
| Confirm team (PROPOSED → ONGOING) | — | ✓ | ✓ | ✓ |
| Submit (ONGOING → SUBMITTED) | ✓ | — | — | ✓ |
| Send back / approve / reject | — | ✓ | ✓ | ✓ |
| Rate & comment | — | ✓ | ✓ | ✓ |
| Publish | — | ✓ | ✓ | ✓ |
| Delete project | ✓ (indirectly, by leaving as the last ACCEPTED author on a PROPOSED/ONGOING project — see §5.4) | ✓ (own courses) | — | ✓ |

---

## 3. Project types

Project types describe the **deliverables** a project must produce.

| Type value | Requires documentation | Requires presentation | Requires external link | Requires cover image |
|---|:---:|:---:|:---:|:---:|
| `CLASSIC_PROJECT` | ✓ | — | — | — |
| `ONLINE_COURSE` | ✓ | — | — | — |
| `PROJECT_WITH_LINK` | ✓ | — | ✓ | ✓ |
| `PROJECT_WITH_PRESENTATION` | ✓ | ✓ | — | ✓ |
| `PROJECT_WITH_LINK_AND_PRESENTATION` | ✓ | ✓ | ✓ | ✓ |
| `PRESENTATION_WITHOUT_DOCUMENTATION` | — | ✓ | — | ✓ |
| `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION` | — | ✓ | ✓ | ✓ |

Each requirement is enforced in the **My Project** panel: the matching
field is highlighted as **incomplete** until a valid value is supplied. The
**Submit** button stays disabled while any required field is missing.

### 3.1 Choosing a type

- A type is chosen when an instructor **confirms the team** (PROPOSED →
  ONGOING). The choice is locked after that.
- Programs and courses may carry a `defaultProjectType`. When set, the
  **Add project** / **Confirm team** dialogs pre-select it.
- For self-proposed projects, the type is **not** required at PROPOSED
  time. Participants only need a title (tagline and description are
  optional). The type is set by the instructor at team confirmation.

### 3.2 The four deliverable slots

A project carries four artefact slots, each on its own column:

- **Documentation** (`documentationUrl`) — uploaded file. Accepted
  formats: `.pdf`, `.doc`, `.docx`, `.odt`; maximum size: 22 MB.
- **Presentation** (`presentationUrl`) — uploaded file. Accepted
  formats: `.pdf`, `.ppt`, `.pptx`, `.odp`; maximum size: 22 MB.
- **External link** (`externalUrl`) — free-text URL, typically a
  GitHub repository or hosted demo. Only `http(s)` schemes are
  rendered; other schemes are silently dropped.
- **Cover image** (`coverImageUrl`) — uploaded image used as the tile
  preview in the project list and showcase.

For types that don't list a slot as required, the field is still
available but optional.

---

## 4. Submission deadlines

### 4.1 The cascade

When the system asks "what deadline applies to *this* project?", it walks
four candidates in order and takes the first one that is set:

1. `Project.submissionDeadline` — per-project override
2. `Course.projectSubmissionDeadline` — per-course default
3. `Program.defaultProjectSubmissionDeadline` — per-program default
4. `Program.achievementRecordUploadDeadline` — legacy program field,
   kept for backwards compatibility

If none of the four are set, the project has no deadline. Wherever the
deadline is displayed (project tile, **My Project** panel, manage grid),
a small annotation indicates which level the value was inherited from.

### 4.2 What "deadline" means

- Deadlines are **calendar dates**, not timestamps. The deadline day
  itself is always open all day, in the user's local time zone.
- A deadline is considered *passed* on the morning of the **following**
  day. This matches how course application periods are handled
  elsewhere in EduHub.
- Once the deadline has passed, the database trigger
  `reject_project_author_join_after_submission_deadline` blocks any new
  join requests on the project's courses. Authors who are already
  ACCEPTED can keep working until an instructor forces a transition.

### 4.3 Where to set it

- **Per project** — instructor → ProjectsManagementGrid → row →
  "Submission deadline".
- **Per course** — admin or instructor → ExpandableCourseRow → "Project
  submission deadline".
- **Per program** — admin → ExpandableProgramRow → "Default project
  submission deadline".

---

## 4a. One active project per course

Each participant can be an **ACCEPTED** author on at most **one active
project per course**. "Active" means the project is in `PROPOSED`,
`ONGOING`, or `SUBMITTED` status — projects that have finished
(`COMPLETED`, `INCOMPLETE`, `PUBLISHED`) do not count.

The rule is enforced by two database triggers on `ProjectAuthor` (see
migration `1778240513761_project_leave_rules_requests_and_declined`):

- **`enforce_one_active_accepted_project_per_course_per_user`** — rejects
  any insert or update that would give the user a second ACCEPTED row on
  a project that shares a course with an existing active ACCEPTED
  project. This blocks both join-acceptance and the nested ACCEPTED row
  created when a user proposes a new project.
- **`decline_pending_requests_on_accepted`** — when a user becomes
  ACCEPTED on a project, every other `REQUESTED` row that user holds on
  projects sharing the same course is set to `DECLINED` in the same
  transaction.

Both triggers are deferred constraint triggers, so nested Hasura
mutations (Project + ProjectAuthor + ProjectCourse in one request) see
all rows when the check runs at COMMIT.

Practical consequences:

- Once you are accepted onto a project, the **Propose project** button
  and every **Request to join** button in that course's project table
  disappear.
- If you had pending join requests on other projects in the same course
  when you were accepted, they are automatically declined. You will see
  their status flip from "Pending" to "Declined" the next time the list
  refreshes.
- When your project reaches a terminal status (`COMPLETED`,
  `INCOMPLETE`, `PUBLISHED`), the rule lifts and you can propose or
  request to join another project in the same course.
- A user can still be active in projects across **different** courses
  at the same time — the rule is per-course.

---

## 5. The author workflow

### 5.1 Proposing a project

1. Open the course page. The **Projects** section appears below the
   course content.
2. If proposals are enabled (`projectProposalsEnabled` on the course,
   falling back to the program default), the **Propose project**
   button is visible.
3. The dialog asks for a **title** and lets you optionally set a
   tagline, description, and the **Accepting participants** flag.
4. On submit, the project is created with status `PROPOSED`, your
   account becomes an `ACCEPTED` author, and the project appears in
   your **My Project** panel.

### 5.2 Joining someone else's project

1. Browse the **Projects** table for the course. Projects in PROPOSED
   status with `acceptingParticipants = true` show a **Request to
   join** button.
2. Clicking the button inserts a `ProjectAuthor` row with
   `participationStatus = REQUESTED`. You must be enrolled in the
   course; the database enforces this via the `user_access` Hasura
   permission.
3. You can only request to join projects that aren't your own and
   where the submission deadline hasn't passed.
4. The request is visible in the project's **Manage requests**
   dialog. The proposer (or any ACCEPTED author) accepts or declines.

### 5.3 The My Project panel

Once you are an ACCEPTED author on a project, the **My Project** panel
replaces the propose-button area. It is the single hub for your project
work and contains:

- **Metadata** — title, tagline, description, cover image,
  documentation, presentation, external link, and the accepting-
  participants toggle. Editable while status is PROPOSED or ONGOING.
- **Authors block** — list of ACCEPTED authors with avatar; a **Leave
  project** button with confirmation.
- **Join requests** — when REQUESTED rows exist, a counter and dialog
  to accept or decline them.
- **Submission checklist** — live view of required fields based on the
  project's type. Each missing item is highlighted in the EduHub error
  colour.
- **Next-todos** — a contextual to-do list ("submit your work",
  "request review", etc.) depending on status.
- **Submit / Request review buttons** — appear at the right phase of
  the workflow.

### 5.4 Leaving a project

- A non-last author can leave at any time.
- The **last ACCEPTED** author can only leave when no `REQUESTED` rows
  remain on the project. The UI guides you to "decide pending requests
  first".
- When the last ACCEPTED author leaves a PROPOSED/ONGOING project, the
  project itself is deleted (a database trigger cascades the remaining
  `DECLINED` rows). This prevents orphaned projects.
- COMPLETED, INCOMPLETE, and PUBLISHED projects are never auto-deleted.

### 5.5 Submitting for review

1. Confirm every requirement in the submission checklist is green.
2. Click **Submit project**. A confirmation dialog summarises what
   will happen.
3. On confirm, status becomes `SUBMITTED`, `submittedAt = now()` is
   stamped server-side, and `submittedBy` is set to your user id
   server-side. Clients cannot pass either value — the database
   trigger plus a Hasura permission preset are authoritative.
4. The project disappears from the editable-by-author view; only
   instructors and mentors can edit it from here on.

### 5.6 Resubmission after send-back

If an instructor sends a project back:

- The project returns to ONGOING and both `submittedAt` and
  `submittedBy` are cleared by the trigger.
- The **My Project** panel re-enables editing. A banner shows the
  instructor's last review comment if one was set.
- Clicking **Submit** again creates a fresh attribution.

### 5.7 Templates and the "copy from template" flow

- Some courses publish **templates**: PROPOSED projects intended to be
  claimed by individuals. They typically have no ACCEPTED authors but
  carry a title, description, and one or more mentors.
- Course participants see a **Use this template** button on template
  rows.
- Clicking it calls the `copyProjectFromTemplate` action, which creates
  a brand-new project in the same course with you as the sole
  ACCEPTED author. Mentors are copied across; authors and the
  title-lock are reset.
- Templates are scoped to the course they live in — you cannot copy a
  template from another course.

---

## 6. The instructor / mentor workflow

### 6.1 The course projects grid

Instructors open a course's **Participations → Projects** tab and see the
`ProjectsManagementGrid` with every project in the course. Each row
exposes:

- Editable cells for type, documentation instruction, title, tagline,
  description, cover image, submission deadline.
- Author list and the **Manage authors** action (add ACCEPTED authors
  directly, view REQUESTED/DECLINED).
- Mentor list and the **Manage mentors** action.
- A **Status** chip and the appropriate action button for the current
  state.

### 6.2 Adding a project as instructor

Use **Add project** to create a project that is already in ONGOING status
with chosen authors. The dialog requires:

- **Title** (mandatory)
- **Project type** (mandatory)
- **Documentation instruction** (auto-defaults to the type's default;
  can be overridden)
- **Authors** (at least one) — added as ACCEPTED immediately

### 6.3 Confirming a team (PROPOSED → ONGOING)

For self-proposed projects, the next instructor action is to confirm
the team:

1. Open the row's **Confirm team** action.
2. Choose the **project type** and **documentation instruction** (the
   type's default is preselected).
3. On confirm: `status = ONGOING`, `acceptingParticipants = false`, and
   the type/instruction are locked. Any outstanding REQUESTED rows are
   converted to DECLINED.

### 6.4 Reviewing a submission

When a project reaches `SUBMITTED`, the row's action column in
ProjectsManagementGrid shows an **Evaluate project** button. Click it
to open the **Review project** dialog. The dialog shows:

- Project metadata, author list, and the three artefact links
  (documentation, presentation, external) — all hardened against unsafe
  URL schemes.
- A **Rating** section (`UNRATED` / `PASSED` / `FAILED`) and a
  **Comment** text area. Both can be saved without changing status.
- Three terminal actions in the dialog footer:
  - **Approve** → status COMPLETED, rating PASSED.
  - **Send back** → status ONGOING; the
    `set_project_submitted_metadata` trigger clears both `submittedAt`
    and `submittedBy` so the next submission re-attributes correctly.
  - **Reject** → status INCOMPLETE, rating FAILED.

Course instructors, project mentors, and admins all share the
`instructor_access` role for projects they own and therefore all see
the **Evaluate project** button and the **Send back** action.

### 6.5 Publishing

A separate **Publish** action on COMPLETED projects flips status to
PUBLISHED. Published projects become readable by the `anonymous`
Hasura role and appear in any public project showcase that consumes the
`PUBLISHED` filter.

### 6.6 Mentors

Mentors are added per project from the manage grid. A mentor sees the
project in their **Instructor view**, can edit the same fields as a
course instructor, can review and rate, but does not need a
course-instructor relationship to the project's course.

---

## 7. Project documentation

EduHub treats project documentation as a **two-layer system**: a catalogue
of named *documentation instructions* (PDFs explaining how to write up a
project of a given type) and a per-project file (the author's actual
write-up).

### 7.1 The instruction catalogue

- Lives in the `ProjectDocumentationInstruction` table.
- Each instruction has a **title**, a **PDF URL**, an associated
  **project type**, and an **isDefault** flag.
- A database constraint guarantees that **exactly one** instruction per
  type is marked default. Promotions are atomic.
- Default URLs follow a stable static path
  (`/project-documentation-instructions/<type>.pdf`). Custom uploads
  live in the GCS bucket and are served via a signed URL.

### 7.2 Where instructions appear

- **At team confirmation** — the dropdown defaults to the type's
  current default but the instructor can pick any instruction belonging
  to the same project type.
- **In the My Project panel** — an ACCEPTED author can download the
  project's current instruction PDF at any time during ONGOING and
  SUBMITTED.
- **In the manage grid** — instructors can change a project's
  instruction after confirmation if requirements change.

### 7.3 Managing the catalogue (admin only)

Open **App settings → Project documentation instructions**. Admins can:

- Filter the catalogue by project type and search by title.
- **Create** a new instruction — title + type + PDF upload (or paste a
  URL).
- **Edit** the title, replace the PDF, or change the URL.
- **Set as default** — promotes the row to the type's default; the
  previous default is demoted in the same transaction.
- **Delete** — only available for non-default rows that are not
  currently referenced by any project.

### 7.4 The author write-up (Documentation field)

The **documentation file** in **My Project** is the author's actual
project write-up — distinct from the instruction PDF.

- Uploaded via the standard FileUploadField; backed by the
  `saveProjectDocumentation` action which writes a public GCS object.
- Accepted formats: `.pdf`, `.doc`, `.docx`, `.odt`; maximum size:
  22 MB.
- For project types that require documentation, the submission
  checklist treats the field as **mandatory**. The submit button stays
  disabled until a file is present.
- For types that do not require documentation
  (`PRESENTATION_WITHOUT_DOCUMENTATION`,
  `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION`), the field is optional
  and can be left empty.

---

## 8. Administrative settings summary

| Setting | Scope | Owner | UI surface |
|---|---|---|---|
| `defaultProjectType` | Program | Admin | ExpandableProgramRow |
| `defaultProjectSubmissionDeadline` | Program | Admin | ExpandableProgramRow |
| `projectProposalsEnabledByDefault` | Program | Admin | ExpandableProgramRow |
| `projectProposalsEnabled` | Course | Admin / Instructor | ExpandableCourseRow |
| `projectSubmissionDeadline` | Course | Admin / Instructor | ExpandableCourseRow |
| Project type catalogue | Global | Admin (migration-defined) | — |
| Project documentation instructions | Global | Admin | App settings → Project documentation instructions |
| Per-project type, instruction, deadline | Project | Instructor / Mentor | ProjectsManagementGrid |
| Per-project artefacts | Project | Author (PROPOSED/ONGOING) or Instructor/Mentor | MyProjectPanel / ProjectsManagementGrid |

---

## 9. Frequently asked questions

**Can I be an author on two projects in the same course at the same time?**
No. As a participant you can be ACCEPTED on at most one *active* project
(PROPOSED, ONGOING, or SUBMITTED) per course — the rule is enforced by the
`enforce_one_active_accepted_project_per_course_per_user` database trigger
described in §4a. You may, however, hold several REQUESTED rows on other
projects in the same course while you wait for a response. Once one of
them accepts you (or you propose your own project), your remaining
REQUESTED rows in that course are auto-DECLINED in the same transaction.
The restriction lifts once your project reaches a terminal status
(`COMPLETED`, `INCOMPLETE`, `PUBLISHED`).

**(For proposers) I still have pending join requests — what do I need to
do before I can ask an instructor to confirm my team?**
Decide every pending request first. The **Request review** button in the
**My Project** panel stays disabled while any `REQUESTED` row exists on a
project that is still accepting participants — the proposer must accept
or decline each applicant via **Manage requests**, or turn off
**Accepting participants**, before the instructor can be asked to
confirm the team. (As a safety net, if any REQUESTED rows do reach
team-confirmation time — e.g. from an instructor override — they are
automatically set to DECLINED when the project transitions PROPOSED →
ONGOING.)

**Can I edit my project after it's been submitted?**
No. Once status is SUBMITTED the project becomes read-only for authors.
You can only resume editing after an instructor sends it back.

**What if I uploaded the wrong file just before submitting?**
You can replace any artefact (documentation, presentation, cover image)
up until the moment you press **Submit**. After submission, ask your
instructor to **send the project back**, and the editable state is
restored.

**What if no instructor responds to my submission before the deadline?**
The deadline only blocks **join requests**, not submissions. Once you
are an ACCEPTED author and have submitted, instructor review can happen
at any time; there is no automatic expiry on SUBMITTED projects.

**Why does `submittedBy` sometimes seem to be set on ONGOING projects I
haven't submitted yet?**
While a project is in PROPOSED/ONGOING, the `user_access` permission
preset writes `submittedBy = your user id` on every update you make.
The value is only *meaningful* once the project reaches SUBMITTED — at
that point it records whoever made the SUBMITTED transition, and the
database prevents anyone else from overwriting it without going through
send-back first.
