# Project Feature — Manual Testing Guide

This guide describes a thorough manual test pass for the project feature
introduced in PR #1717. It covers both the **new functionality** and a
**regression sweep** of shared components that this PR also touched.

Read it top to bottom; the early sections set up the data and roles that
later sections re-use.

---

## 1. Test environment

| Item | Expectation |
|---|---|
| Branch under test | `feat/project-ui-step-1-5` (or the merged PR on staging) |
| Database | Run `hasura migrate apply` then `hasura metadata apply` against a fresh dev DB. Confirm migration `1778240513761` and `1779300000000` apply cleanly. |
| Frontend | `yarn start` on the `frontend-nx` workspace. |
| Browsers | Latest Chrome plus one of: Firefox or Safari. Mobile profile of Chrome (DevTools device toolbar) for the touch-target check. |
| Console | Watch the browser console throughout — no red errors or React warnings should appear during normal use. |
| Logs | Keep `docker-compose logs -f hasura` open. Database trigger errors surface here. |

---

## 2. Test data

Create the following before testing. Anything marked **fresh** must not
exist on production-like data; use a throw-away dev DB.

### 2.1 Roles (use the existing seed users or create new ones)

| Alias | Role | What they need |
|---|---|---|
| `admin` | Admin | Full access to App settings and all manage screens. |
| `instr-a` | Instructor | Assigned as CourseInstructor on Course A. |
| `instr-b` | Instructor | Assigned as CourseInstructor on Course B. |
| `mentor` | User with `instructor_access` via ProjectMentor only — **not** a course instructor. |
| `user-1` | Course participant | Enrolled in Course A and Course B. |
| `user-2` | Course participant | Enrolled in Course A only. |
| `user-3` | Course participant | Enrolled in Course B only. |
| `anon` | (no login) | Used to verify anonymous read access. |

### 2.2 Programs and courses (fresh)

- **Program P1** with `defaultProjectType = PROJECT_WITH_DOCUMENTATION_ONLY`,
  `projectProposalsEnabledByDefault = true`,
  `defaultProjectSubmissionDeadline` set to **tomorrow**.
- **Program P2** with no project defaults set.
- **Course A** in Program P1, `projectProposalsEnabled = NULL` (inherits
  from program), no per-course deadline. `achievementCertificatePossible = true`.
- **Course B** in Program P2, `projectProposalsEnabled = true`,
  `projectSubmissionDeadline` set to **2 days ago** (already past).
- **Course C** in Program P2, `projectProposalsEnabled = false`.

### 2.3 Project documentation instructions

In **App settings → Project documentation instructions**, confirm that
every `ProjectType` already has a default instruction. If not, upload a
small PDF and mark it default for the missing types. Add **one extra**
non-default instruction for `PROJECT_WITH_DOCUMENTATION_ONLY` to test the picker.

All instructions seeded this way are **platform** instructions
(`createdByUserId IS NULL`). For §8.1, also upload one instruction as `instr-a`
from inside a course so at least one personal instruction exists.

---

## 3. Regression sweep — shared components

These tests verify that screens *outside* the project feature still work
after PR #1717's edits to shared code.

### 3.1 FileDownload (`components/inputs/FileDownload.tsx`)

Tested where FileDownload is rendered outside projects:

- **Achievement templates list** (App settings → Achievement templates):
  click a template's download button → file opens in a new tab. Verify
  `window.opener` is null in the new tab (DevTools console:
  `window.opener` should print `null`).
- **AchievementRecord upload modal**: trigger the existing-file
  download link. New tab opens, opener is null, original tab is not
  navigated.
- Try with `directAsset` (a `/public/...` path served by Next) and a
  signed GCS URL — both should open correctly.

### 3.2 FileUploadField (`components/inputs/FileUploadField/index.tsx`, `utils.ts`)

Outside the project flow:

- **ExpandableCourseRow → Course cover image upload**: upload a JPG.
  Preview shows immediately; refresh — image survives.
- **ExpandableProgramRow → Achievement / attendance certificate template
  upload**: upload a PDF; verify file icon and label, download the
  uploaded file via the FileDownload pair.
- **Mobile (DevTools, iPhone profile)**: open any FileUploadField that
  has the info tooltip (e.g. the cover image with tooltip). Tap the
  small "i" icon. Its hit area should measure **at least 44 × 44 px**
  on mobile (use Elements → Computed → check min-width / min-height).
- Upload a `.odp` (OpenDocument presentation) file to a project
  presentation field. The list shows the "presentation" icon, not the
  generic "unknown file" icon.

### 3.3 Hasura mutations with passed headers (`hooks/authedMutation.ts`)

`useFlexibleMutation('role', …)` now merges caller headers rather than
replacing them. The only consumer today is FileUploadField. To regress:

- Upload a project cover image while logged in as `instr-a` and again as
  `user-1` (own project). Both uploads succeed. Network panel: the
  request carries `x-hasura-role` matching the caller's role (admin or
  user/instructor) **plus** any extra header the caller set.

### 3.4 Locales (`locales/en.json`, `locales/de.json`)

The duplicate `common.error` key was removed. Confirm:

- Any error fallback message in the app (e.g. trigger an upload error by
  cancelling mid-upload) still renders a translated string in both EN
  and DE. The visible text must come from the surviving
  `common.error` value ("An error occurred" / "Ein Fehler ist
  aufgetreten").
- Switch languages mid-session in the header dropdown — no missing-key
  warnings in the console.

### 3.5 `useRoleQuery` swap (was `useAuthedQuery`)

Manage Course → **Projects** sub-tab, Manage Programs → expand a row,
Add Project dialog: all read project types and documentation
instructions. Confirm:

- Dropdowns populate (no permanently blank state).
- Network panel: the query carries `x-hasura-role` matching the
  current role; switching role in the header refetches with the new
  role header.

### 3.6 Project preview / review URL hardening

Confirm that URL safety added to ProjectPreviewLayout and
ReviewProjectDialog does not break legitimate links:

- On a project with `https://github.com/…` external URL — link renders
  and opens in a new tab with `rel="noopener noreferrer"`.
- Edit the project (DB or admin UI) to set the external URL to
  `javascript:alert(1)` — the link should **not** render at all in either
  ProjectPreviewLayout or ReviewProjectDialog.
- Set the URL to a relative path like `/foo` — the link should not
  render (only `http(s)` schemes are allowed).
- Repeat for `documentationUrl` and `presentationUrl`.

### 3.7 Existing My Project / participations screens

Open a finished test course from before the PR (or seeded data):

- Course participations tab loads — no console errors, all existing
  participants render with their attendance/achievement chips.
- Manage Course → Course settings tab: the new
  `projectProposalsEnabled` and `projectSubmissionDeadline` controls
  appear, but flipping them does **not** affect non-project parts of the
  page (cover image, ECTS, group tags, etc.).

---

## 4. New feature — happy path

This section walks the full project lifecycle once. Roles are noted in
**bold** before each step.

### 4.1 Course settings (admin)

**As `admin`**:

1. Open Manage Programs → expand P1. Confirm the three new program-level
   controls render:
   - **Default project type** = Projekt (nur Dokumentation) (PROJECT_WITH_DOCUMENTATION_ONLY).
   - **Project proposals enabled by default** is on.
   - **Default project submission deadline** = tomorrow.
2. Change P1's default deadline to **+7 days** and back. Toast confirms,
   refresh persists.
3. Open Manage Courses → expand Course A. The course inherits P1
   defaults (a hint indicates "Inherited from program"). Set a per-course
   deadline of **+3 days**. The hint should now disappear / change.
4. On Course B, set `projectProposalsEnabled = true` even though the
   program default is false — the override sticks.

### 4.2 Self-proposed project (user)

**As `user-1`** in Course A:

1. Open the course page → scroll to **Projects** section. The
   **Propose project** button is visible (proposals enabled).
2. Click **Propose project**. Fill in title "User-1's first project".
   Leave tagline/description empty. Submit.
3. The dialog closes; the **My Project** panel appears with the new
   project, status chip `PROPOSED`, you listed as the only ACCEPTED
   author.
4. Open the **Projects** table below — your project does **not** appear
   there (it lives in the My Project panel).

### 4.3 Join request (other users)

**As `user-2`** in Course A:

1. Course page → Projects section. The **Propose project** button is
   visible (you have no project). The table shows User-1's project with
   a **Request to join** button.
2. Click it. The button changes to "Request pending".
3. The console / network show no errors.

**As `user-1`**:

1. **My Project** panel → click the **Manage requests** button (counter
   shows "1"). Dialog lists User-2 with **Accept** / **Decline**.
2. Click **Accept**.
3. User-2 appears in the Authors block as ACCEPTED.
4. Refresh; state survives.

**As `user-2`**:

1. Open Course A → Projects. The **My Project** panel now appears with
   User-1's project (you are an ACCEPTED author).
2. The **Propose project** button is gone.
3. In the Projects table, all other projects' join buttons are hidden.

### 4.4 The one-active-project rule (auto-decline)

Reset: create a fresh test case. **As `user-3`** in Course B:

1. Browse Course B → Projects table. Make three side-projects ready
   (have `admin` propose three projects in Course B if not already
   present).
2. Click **Request to join** on all three. Each row shows "Request
   pending".
3. Have the proposer of Project 1 (or admin) accept user-3.
4. **Refetch / reload** the Projects table. Projects 2 and 3 now show
   "Request declined" — auto-declined by the
   `decline_pending_requests_on_accepted` trigger.
5. **As `user-3`** again: confirm the **Propose project** button is
   hidden and join buttons are hidden.

Then verify the rule lifts when the project finishes:

1. As `instr-b`, evaluate `user-3`'s project to COMPLETED (see §4.7).
2. As `user-3`, return to Course B → Projects. The **Propose project**
   button is visible again; **Request to join** buttons reappear for
   open projects.

### 4.5 Authoring while PROPOSED / ONGOING (user)

**As `user-1`** in the My Project panel:

1. Fill in tagline, description, cover image, documentation URL (use a
   sample `.pdf`), presentation URL (sample `.pptx`).
2. The submission checklist updates live. Required fields specific to
   the project type light up green when filled.
3. Toggle **Accepting participants** off; the **Request to join**
   button disappears from the table for User-3 (refetch).

### 4.6 Team confirmation (instructor → ONGOING)

**As `instr-a`** in Manage Course A → **Participations → Projects**:

1. Find User-1's project. Status chip shows PROPOSED.
2. Click **Confirm team**. Uncheck **Präsentations-Upload** so the type
   resolves to *Projekt (nur Dokumentation)* (`PROJECT_WITH_DOCUMENTATION_ONLY`), keep the default
   documentation instruction. Confirm.
3. The status chip flips to ONGOING. **Accepting participants** is now
   locked off. Type and instruction stay **editable** and an amber warning
   appears above them explaining what changing the type does.
4. As `user-1`: refresh the course page. The "Request to join" buttons
   on the Projects table are gone; the My Project panel still allows
   editing artifacts.

### 4.6b Changing the project type of an ONGOING project

**As `instr-a`** in Manage Course A → **Participations → Projects**, on the
project just confirmed:

1. Expand the row. The deliverable checkboxes are **enabled** and the amber
   ONGOING warning is visible; the "locked" hint is gone.
2. Check **Präsentations-Upload**. The type becomes
   `PROJECT_WITH_PRESENTATION` and the documentation instruction switches to
   that type's default. No Postgres constraint error appears.
3. As `user-1`: the My Project panel now highlights the presentation slot as
   mandatory and **Submit** is disabled until it is filled.
4. Back as `instr-a`, uncheck it again — the project returns to
   `PROJECT_WITH_DOCUMENTATION_ONLY` and the presentation slot stops being mandatory. The already
   uploaded presentation file is **kept**.
5. Uncheck everything, then check only **Externer Link**: the reworded
   invalid-combination error shows and nothing is persisted.
6. Negative test: `UPDATE "ProjectDocumentationInstruction" SET url = NULL
   WHERE "projectTypeValue" = 'PROJECT_WITH_DOCUMENTATION_ONLY'`, reload, and try to switch an ONGOING
   project to that type. Expect the friendly "no documentation instruction"
   message, **not** a raw
   `Project_ongoing_requires_type_and_instruction_check` error. Restore
   afterward.
7. After the team submits, re-expand the row: the checkboxes and the
   instruction dropdown are **disabled** and the hint reads "…until the
   project has been submitted". **Send back** re-enables them.

### 4.7 Submission, review, send-back, approval

**As `user-1`**:

1. My Project panel → the **Submit project** button is enabled now that
   all required fields are present.
2. Click **Submit**. Confirmation dialog summarises what happens →
   confirm.
3. Status chip becomes SUBMITTED. The panel becomes read-only. The
   "Submitted at" timestamp appears, attributed to User-1.

**As `instr-a`** in ProjectsManagementGrid:

1. The project row now shows an **Evaluate project** button. Click it.
2. The **Review project** dialog opens with project metadata, author
   list, and the three artifact links.
3. Click **Send back**. Dialog closes; status returns to ONGOING.
   `submittedAt` and `submittedBy` are cleared (visible in the
   submission attribution area of the My Project panel — both show as
   empty).

**As `user-1`**:

1. Edit the project (e.g. update description), upload a new
   documentation file, click **Submit** again. Submission attribution
   shows User-1 + the new timestamp.

**As `instr-a`** again:

1. Open the Review dialog. In the Rating section, pick `PASSED` and add
   a comment. Save without changing status — the rating persists.
2. Click **Approve**. Status flips to COMPLETED, rating is PASSED.

### 4.8 Publishing and anonymous visibility

**As `instr-a`**:

1. The completed project's row shows a **Publish** action. Click it.
2. Status becomes PUBLISHED.

**As `anon`** (logout):

1. Visit the course's public page (if your test deployment exposes one)
   or hit the Project list endpoint. The published project should be
   visible. The `submittedBy` field must **not** appear in the response
   (verify via DevTools network → Hasura response).

### 4.9 Leaving and auto-cleanup

Reset using a fresh project (one ACCEPTED author, no requests).

**As that author**: click **Leave project**. Confirm. Project is
auto-deleted (returns to the courses-with-no-project state).

Now reproduce the protected case:

1. Author proposes project, status PROPOSED.
2. Another user requests to join (REQUESTED row exists).
3. Author tries to **Leave**. UI prevents it; tooltip / error explains
   that pending requests must be handled first.
4. After accepting or declining the request, leaving works again.

### 4.10 Templates and `copyProjectFromTemplate`

In Course A, **as `admin`**, create a PROPOSED project with no ACCEPTED
authors — this is a template. Attach a mentor.

**As `user-2`** (assuming their previous project has finished):

1. Course A → Projects table. The template row shows **Use this
   template** instead of **Request to join**.
2. Click it. A new project is created with you as ACCEPTED author, the
   mentor copied across, status `PROPOSED` or `ONGOING` (depending on
   template type — ONLINE_COURSE templates start ONGOING).
3. Verify the My Project panel reflects the new project.
4. As an extra check, in DevTools network, the `copyProjectFromTemplate`
   call now includes `courseId`. If you craft a request with a
   `parentProjectId` from a different course, the server should respond
   with `COPY_PROJECT_NOT_FOUND`.

---

## 5. New feature — by project type

For each type below, the corresponding deliverable slot must be marked
required in the submission checklist; submitting must be blocked until
the slot is filled.

| Type | Required slots to test |
|---|---|
| `CLASSIC_PROJECT` | Documentation (legacy, not selectable in the picker) |
| `PROJECT_WITH_DOCUMENTATION_ONLY` | Documentation + cover image |
| `ONLINE_COURSE` | Documentation |
| `PROJECT_WITH_LINK` | Documentation + cover image + external link |
| `PROJECT_WITH_PRESENTATION` | Documentation + presentation + cover image |
| `PROJECT_WITH_LINK_AND_PRESENTATION` | Documentation + presentation + external link + cover image |
| `PRESENTATION_WITHOUT_DOCUMENTATION` | Presentation + cover image (docs optional) |
| `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION` | Presentation + external link + cover image (docs optional) |

For each type, follow this script:

1. **As `admin`**, in App settings → Project documentation instructions,
   confirm a default instruction exists for the type.
2. **As `instr-a`**, in ProjectsManagementGrid → **Add project**: pick
   the type. The documentation instruction picker pre-selects the
   default. Picker only shows instructions for that type.
3. **As `user-1`** (an ACCEPTED author on the freshly created project):
   confirm the submission checklist shows the right items.
4. Fill the required slots one by one. The Submit button stays disabled
   until every required slot is filled.
5. Submit, then **as `instr-a`** approve. Confirm the project lands in
   COMPLETED.

Note specifically for `ONLINE_COURSE`: when a template of this type is
claimed via copy, the new project starts in ONGOING status with
`acceptingParticipants = false`. Verify this in the My Project panel of
the claimer.

---

## 6. New feature — by role

### 6.1 Anonymous (`anon`)

- Public course pages render. Published projects are visible.
- `submittedBy` is **not** in the response payload.
- No "Propose project" / "Request to join" buttons.

### 6.2 User (`user-1`, `user-2`, `user-3`)

- Can propose, request to join, manage own join requests on own
  projects, leave projects.
- Cannot edit projects they are not ACCEPTED on.
- Cannot see grading fields (`rating`, `ratingComment`) on someone
  else's project.
- Cannot click **Submit** on someone else's project (the My Project
  panel only shows when ACCEPTED).
- After being ACCEPTED on an active project in a course, all
  propose/join buttons in that course are hidden.

### 6.3 Instructor (`instr-a`, `instr-b`)

- Sees every project in own courses in ProjectsManagementGrid.
- Can confirm team, manage authors and mentors, edit any project field,
  submit reviews, send back, approve, reject, publish.
- Cannot see or act on projects in courses they don't instruct.
- Add Project dialog requires title + type + at least one author.

### 6.4 Mentor (`mentor`)

- Add `mentor` as ProjectMentor on a specific project in Course A.
- `mentor` logs in. Manage Course A → Projects: only the mentored
  project is visible.
- Mentor can use **Evaluate project**, **Send back**, **Approve**,
  **Reject** on the mentored project.
- Mentor cannot see other projects in the course.

### 6.5 Admin (`admin`)

- Has access to App settings → Project documentation instructions
  (create, edit, set default, delete non-default).
- Can manage all projects across all courses.
- All program/course-level project defaults are editable.

---

## 7. Submission deadline behaviour

Use Course B (course deadline 2 days ago) and a fresh
project there:

1. **As `user-3`**: try to **Request to join** an open project in
   Course B. The DB trigger
   `reject_project_author_join_after_submission_deadline` rejects the
   insert. A friendly error message surfaces in the UI.
2. **As `user-3`** with an existing ACCEPTED project from before the
   deadline: confirm you can still edit and submit.
3. Set a per-project `submissionDeadline` of `today` on Course B's
   project. Verify the deadline date itself is **inclusive** — you can
   still submit today, but at midnight the deadline counts as passed.
4. Set `submissionDeadline` to `2025-02-31` via direct database
   modification (or via the admin UI's date picker behavior). The
   project page must not crash; the date helper rejects impossible
   calendar dates and treats the project as having no deadline.

---

## 8. Documentation instruction catalogue (admin)

In App settings → Project documentation instructions:

1. Create a new instruction. Title + type + upload a PDF. Confirm it
   appears in the table.
2. Set it as default for its type. The previous default is demoted in
   the same operation.
3. Try to delete the new default — the delete button is disabled.
4. Demote it (set another row as default) and delete it. Confirm.
5. The icon-only delete button has a screen-reader-readable label. In
   Chrome DevTools → Accessibility, confirm the **Accessible name**
   reads "Delete documentation" (or your translation).
6. Instructor uploads (see §8.1) are listed here too. **Set as default** on such
   a row is refused with `..._NOT_PLATFORM` — a personal instruction must never
   become a type default.
7. Uploading a non-PDF renamed to `.pdf` is now rejected on content
   (`INVALID_FORMAT`), not just on extension.

---

## 8.1 Own documentation instructions (instructor)

Roles: `instr-a` and `instr-b` are instructors on **different** courses;
`user-1` is an ACCEPTED author on one of `instr-a`'s ONGOING projects.

**Happy path — as `instr-a`**, on an ONGOING project in Manage Course →
Participations → Projects (expand the row), and again in **Add project** and
**Confirm team**:

1. Click the upload button next to the instruction dropdown. Enter a title,
   choose a PDF, submit.
2. The dialog closes, the new instruction is **selected** in the dropdown, and it
   appears among the options. No console warnings about an out-of-range value.
3. Reopen the dialog: the instruction is listed under *your instructions* with a
   title field, an open button, **PDF ersetzen**, and a delete button.
4. Rename it (the field saves on blur) and replace its PDF. Both persist after a
   reload. There is deliberately **no** "remove PDF" control: clearing the URL
   would hide an instruction that projects still reference.
5. Delete it. A project still using it falls back to the type default and the
   number of reassigned projects is reported.

**Guards:**

6. On a PROPOSED project without a type, the button is disabled and its tooltip
   explains why.
7. After the team submits, the button and the dropdown are both disabled.
8. For a project type with no instruction at all, the section still renders so
   the first instruction can be created.

**Isolation matrix:**

9. As `instr-b`: `instr-a`'s instruction is **not** in any dropdown and not in
   the dialog list. Platform instructions are still all visible.
10. Add `instr-b` as a CourseInstructor on `instr-a`'s course: `instr-b` now sees
    that instruction for the project that uses it (so the dropdown is never out
    of range) but still cannot rename or delete it.
11. As `user-1`: the instruction PDF still downloads from **My Project**. Confirm
    in the network panel that the response contains no `createdByUserId`.

**Negative GraphQL** (Hasura console as `instr-b`, `x-hasura-role: instructor`):

12. `update_ProjectDocumentationInstruction_by_pk` on `instr-a`'s row → affects
    zero rows.
13. `insert_..._one` with `createdByUserId` or `isDefault` → the field does not
    exist in the input type.
14. `_set: { projectTypeValue }` → field not in the set input type.
15. `_set: { url: "programs/program-1/private/x.pdf" }` on an own row → check
    constraint violation (`..._owned_url_prefix_check`).
16. `delete_..._by_pk` on any row that has a URL → affects zero rows (real
    deletes must go through the action).
17. **`saveProjectDocumentationInstruction` against a row `instr-b` does not
    own**, using that row's exact filename → `..._UNAUTHORIZED`, and the object
    in the bucket is byte-identical afterwards. This is the overwrite the
    dedicated handler exists to prevent.
18. `deleteProjectDocumentationInstruction` on `instr-a`'s row →
    `..._FORBIDDEN`; on any default row → `..._IS_DEFAULT`.
19. Upload a file named `../../../evil.pdf` → stored as
    `project-docs-instructions/public/instruction-<id>/evil.pdf`; confirm on the
    dev container filesystem that nothing was written outside that folder.

---

## 9. Author cleanup edge cases

These exercise the leave / delete triggers added by migration
`1778240513761`:

1. **Two ACCEPTED authors, no requests**: each can leave individually.
   Project survives until the second leaves; then it is deleted.
2. **One ACCEPTED, no requests**: that author leaves → project
   immediately deleted.
3. **One ACCEPTED, one REQUESTED**: ACCEPTED author tries to leave →
   blocked with `last_accepted_cannot_leave_while_join_requests_pending`.
   Decline the request first → leave succeeds → project deleted.
4. **Concurrent leaves** (open two tabs): both authors leave at almost
   the same time. The advisory lock keeps the cleanup consistent —
   either the project is deleted exactly once or one leave gets a
   "last accepted" error if a race triggers the check_violation; no
   orphaned `Project` row with zero ACCEPTED authors should remain.
5. **COMPLETED / INCOMPLETE / PUBLISHED projects**: an author leaving
   does **not** delete the project. Confirm: complete a project, then
   leave as the sole author. Project row still exists.

---

## 10. Accessibility quick pass

- Keyboard-tab through ProjectFormFieldSection — the help-tooltip icon
  is focusable, opens its tooltip on focus, and has a meaningful
  accessible name.
- Keyboard-tab to the row delete button in
  ProjectDocumentationInstructionsSection — screen reader reads a
  meaningful label (not just "button").
- All `<a>` artifact links from project metadata have
  `rel="noopener noreferrer"` and `target="_blank"`.

---

## 11. Database integrity sanity checks

Open a SQL shell into the DB and run these read-only checks after the
above scenarios:

```sql
-- Every ACCEPTED ProjectAuthor row should be unique per user per course
-- for active projects.
SELECT pa."userId", pc."courseId", count(*)
FROM "ProjectAuthor" pa
JOIN "ProjectCourse" pc ON pc."projectId" = pa."projectId"
JOIN "Project" p ON p.id = pa."projectId"
WHERE pa."participationStatus" = 'ACCEPTED'
  AND p."status" IN ('PROPOSED','ONGOING','SUBMITTED')
GROUP BY pa."userId", pc."courseId"
HAVING count(*) > 1;
-- → 0 rows.

-- submittedBy is null exactly when submittedAt is null.
SELECT id, "submittedAt", "submittedBy"
FROM "Project"
WHERE ("submittedAt" IS NULL) <> ("submittedBy" IS NULL);
-- → 0 rows (or only rows where status is briefly mid-transition; rerun).

-- No SUBMITTED project lacks a submitter.
SELECT id FROM "Project"
WHERE status = 'SUBMITTED' AND ("submittedAt" IS NULL OR "submittedBy" IS NULL);
-- → 0 rows.

-- No orphan projects in PROPOSED/ONGOING with zero ACCEPTED authors.
SELECT p.id FROM "Project" p
WHERE p.status IN ('PROPOSED','ONGOING')
  AND NOT EXISTS (
    SELECT 1 FROM "ProjectAuthor" pa
    WHERE pa."projectId" = p.id
      AND pa."participationStatus" = 'ACCEPTED'
  );
-- → 0 rows.

-- Documentation instruction per project always matches the project's type.
SELECT p.id, p.type, di.id, di."projectTypeValue"
FROM "Project" p
JOIN "ProjectDocumentationInstruction" di
  ON di.id = p."documentationInstructionId"
WHERE di."projectTypeValue" IS DISTINCT FROM p.type;
-- → 0 rows.
```

If any query returns rows, capture the data and file a regression.

---

## 12. Reporting

For each scenario where the actual behaviour deviates from the
expectation, capture:

- The role(s) used.
- The exact steps, with timestamps.
- The browser console output and Hasura container log around the time
  of the failure.
- A screenshot of the failing screen (DevTools network panel
  collapsed open if applicable).
- The output of the SQL checks in §11 right after reproduction.

Attach the bundle to the bug ticket and link it to PR #1717.
