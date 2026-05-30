# Course Page Performance Plan

## Context

Issue [#1681](https://github.com/eduhub-org/eduhub/issues/1681) started with the
Degree Participations tab on `manage > course > degrees > view`, but the
remaining performance problems are broader than that tab. The completed
DegreeParticipations refactor moved the heaviest degree-participation table work
behind a dedicated paginated query and added the `DegreeParticipationStats`
view. The next step should reduce the data loaded by the course page itself and
by the normal course-participation path.

The main pattern to fix is: the manage course page loads one large course query
on mount, even when the user only sees the description tab. Normal course pages
have a similar risk because the public/authenticated course queries fetch more
relationship data than most first-paint views need.

## Current State

Completed or mostly completed for #1681:

- `DegreeParticipationsTab` uses `DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS`
  with `limit`, `offset`, `CourseEnrollments_aggregate`, and server-side sort
  mappings for ECTS and attended events.
- `TableGrid` no longer slices already server-paginated data when server-side
  sorting is enabled.
- Degree participation totals are served by the Hasura
  `DegreeParticipationStats` view.
- Development seed data includes a degree-oriented performance dataset.
- The manage course route waits for an authenticated session before mounting
  `ManageCourseContent`, which avoids an early unauthenticated query/error.

Still unresolved:

- `ManageCourseContent` always runs `MANAGED_COURSE` on mount. That query still
  includes all course enrollments, user details, per-user attendances, per-user
  course enrollments, sessions, achievement options, and achievement records.
  This affects degree courses and normal courses before the user opens the tab
  that needs those rows.
- `CourseParticipationsTab` has its own paginated table query, but the query
  also fetches all sessions and all achievement records for the course on every
  table page.
- `DescriptionTab` receives the large manage-course result even though it mostly
  needs course metadata, locations, sessions for location propagation, and
  program/chat metadata.
- The authenticated normal course page uses `COURSE_WITH_ENROLLMENT`, which
  fetches all `CourseEnrollments` for the course so the frontend can derive the
  current user's enrollment.
- Loading and missing-course states are still coarse. A query in progress can
  look like "not found" or an otherwise empty page instead of a stable loading
  state.

## Goals

- Make the first manage-course render depend only on course-shell data needed
  for the header, tab visibility, access check, and the initially selected tab.
- Load participant-heavy data only after the user opens the relevant tab.
- Reuse static tab data, such as sessions and achievement options, instead of
  fetching it again for every paginated table request.
- Apply the same query-splitting principle to normal course pages: fetch the
  current user's enrollment directly instead of all course enrollments.
- Keep TableGrid behavior consistent for server-side pagination, sorting, and
  search.
- Show explicit loading, empty, and missing-course states without misleading
  copy.

## Non-Goals

- Do not redesign the manage course UI.
- Do not replace `TableGrid`.
- Do not change certificate eligibility rules.
- Do not make bulk actions operate across filtered rows that are not selected in
  the current UI. That can be planned separately if product wants "select all
  matching filter" behavior.

## Implementation Plan

### 1. Establish a Baseline

Use the seeded degree performance course and at least one normal course with many
participants.

Measure:

- GraphQL response size and duration for `MANAGED_COURSE` on initial page load.
- Time until the description tab is usable.
- GraphQL response size and duration when opening Course Participations.
- GraphQL response size and duration when opening Degree Participations.
- Browser main-thread time while rendering the first table page.

Record the before/after numbers in the PR description. If possible, also run
Hasura `EXPLAIN` for the new paginated tab queries.

### 2. Split the Manage Course Shell Query

Create a smaller query for the initial manage page, for example
`MANAGED_COURSE_SHELL`.

The shell query should include only:

- Course id, title, status, publication state, program id/shortTitle, and
  registration type.
- Instructor ids needed for the access check.
- Fields needed to render the tab bar and course header.
- Fields needed by `DescriptionTab` on first render, or move those into a
  dedicated `MANAGED_COURSE_DESCRIPTION` query if keeping the shell smaller is
  cleaner.

Remove from the initial query:

- Full `CourseEnrollments`.
- Nested `User.CourseEnrollments`.
- Nested `User.Attendances`.
- `AchievementOptionCourses.AchievementOption.AchievementRecords`.
- Any participant-only certificate data.

Update `ManageCourseContent` so each tab owns the query for the data it needs.
`DegreeParticipationsTab` already follows this direction. `CourseParticipationsTab`,
`ApplicationsTab`, and `SessionsTab` should follow the same pattern where they
still depend on the old giant result.

### 3. Make Tab Data Lazy and Cache-Friendly

Keep tab components mounted only when active, or use Apollo `skip`/lazy query
semantics when a tab needs to preserve local state.

For participant-heavy tabs:

- Fetch table rows with `limit`, `offset`, `where`, and `order_by`.
- Fetch aggregate counts in the same table query.
- Fetch static tab metadata separately when it does not depend on pagination.
  For Course Participations, sessions and achievement options should not be
  returned again for each page of `CourseEnrollments`.
- Prefer stable entity ids and Apollo field policies that do not create refetch
  loops when shell and tab queries write to the same `Course` object.

Expected split for Course Participations:

- `COURSE_PARTICIPATIONS_TABLE`: paged confirmed enrollments, current-page user
  attendance data, current-page certificate fields, and aggregate count.
- `COURSE_PARTICIPATIONS_META`: sessions, max missed sessions, certificate
  booleans, achievement options.
- `COURSE_PARTICIPATION_RECORDS_FOR_PAGE` or a nested current-page-safe records
  selection: achievement records needed to rate/download records for visible
  rows only.

### 4. Reduce Normal Course Page Payloads

Split `COURSE_WITH_ENROLLMENT` into page shell data plus user-specific data.

Recommended shape:

- `COURSE_PAGE_PUBLIC`: title, description fields, pricing fields, instructors,
  locations, sessions, degree-course links, funding organizations, and program
  display fields.
- `COURSE_PAGE_VIEWER_ENROLLMENT`: the current user's enrollment for this course
  using `CourseEnrollments(where: { userId: { _eq: $userId } }, limit: 1)`.
- `COURSE_PAGE_VIEWER_ATTENDANCES`: only the current user's attendances for this
  course. This can stay nested under sessions if the session list is needed
  anyway, but it must not require all course enrollments.
- `COMPLETED_DEGREE_ENROLLMENTS` should remain lazy for degree courses and only
  run when the completed-degree section is visible and the user is logged in.

Avoid fetching all enrollments from a normal course page just to calculate:

- the viewer's registration state,
- onboarding eligibility,
- certificate download links,
- invoice links.

Those should come from the viewer enrollment query.

### 5. Tighten Loading, Empty, and Missing States

Add a shared page-level loading state for manage course pages:

- While the shell query is loading, show a centered spinner and short loading
  copy.
- Show "course not found" only after the shell query completed successfully with
  `Course_by_pk === null`.
- Show access-denied/empty state only after both the shell data and the
  instructor/admin check can be evaluated.

Add the same distinction to normal course pages:

- Router/session loading.
- Course query loading.
- Course missing.
- Course present but tab/section data loading.

`TableGrid` should also render a clear loading row or spinner when `loading` is
true instead of hiding the table body without feedback.

### 6. Verify Server-Side Table Semantics

For every server-backed `TableGrid` use:

- Pass `sorting` and `onSortingChange` when the query accepts `order_by`.
- Pass `totalCount`, `pageIndex`, `pageSize`, and `onPageSizeChange`.
- Keep `manualPagination` and server-side sorting aligned so rows are never
  sliced twice.
- Reset `pageIndex` on search, sorting, and page-size changes.

Add focused tests for:

- `useTableGrid` variable generation for `limit`, `offset`, search filters, and
  `order_by`.
- `TableGrid` rendering all rows provided by the server on page 2 instead of
  slicing them again.
- Course/Degree participation sort mapping where a sortable column maps to a
  nested Hasura `order_by`.

### 7. Database and Hasura Follow-Up

After the query split, inspect generated SQL for the slowest paths.

Likely candidates:

- Indexes for `CourseEnrollment(courseId, status)`.
- Indexes for `CourseEnrollment(userId, courseId)`.
- Indexes for `Attendance(userId, sessionId)` or the currently used attendance
  lookup predicates.
- Indexes for `AchievementRecord(courseId, created_at)` and author lookups if
  the visible-page achievement-record query is still slow.
- If `DegreeParticipationStats` is expensive for larger datasets, consider a
  materialized view or denormalized stats table refreshed by certificate and
  enrollment changes. Do this only after measuring the normal view under the
  target dataset.

Follow the migration workflow for any schema/index changes and regenerate
GraphQL types after metadata or query changes.

## Suggested Delivery Order

1. Add baseline measurements and a small loading-state cleanup.
2. Introduce `MANAGED_COURSE_SHELL` and move `ManageCourseContent` to shell-first
   rendering.
3. Move Course Participations to split metadata/table queries.
4. Split normal course page viewer enrollment data from public course data.
5. Add focused TableGrid/useTableGrid tests.
6. Re-measure and add database indexes only where measurements show a real
   bottleneck.

## Acceptance Criteria

- Opening a manage course description tab does not fetch all participant rows.
- Opening a degree course does not fetch Degree Participations data until that
  tab is selected.
- Opening a normal course does not fetch all course enrollments just to find the
  current user's enrollment.
- Course Participations pagination does not refetch static metadata for every
  table page.
- Loading, missing-course, and access-denied states are visually distinct.
- Degree Participations sorting/search/pagination behavior from #1681 remains
  intact.
- The seeded large-degree case remains usable on normal desktop widths.
