# Implementation plan: Degree Participations TableGrid refactor

This file contains implementation notes that are useful for planning, but too detailed for the GitHub issue body.

## Suggested branch name

`fix/tablegrid-degree-participations-performance`

## Progress checklist

- [x] Scope the current Degree Participations flow.
- [x] Define and add realistic development seed data.
- [ ] Capture the current baseline behavior with the larger dataset.
- [x] Fix server-paginated Degree Participations pages being sliced a second time.
- [x] Fix full-dataset sorting for attended events and total ECTS.
- [ ] Defer Degree Participations loading until the tab is opened.
- [ ] Improve loading and rendering performance.
- [ ] Clean up loading states and misleading transient errors.
- [ ] Improve Degree Participations table layout.
- [ ] Regression-check other TableGrid usages.
- [ ] Verify with lint, tests, and manual large-dataset checks.

## 1. Scope the current flow

- Locate the Degree Participations page and tab implementation.
- Identify the GraphQL queries and hooks used for course, degree, participations, ECTS, and attended events.
- Inspect `frontend-nx/apps/edu-hub/components/common/TableGrid/` and `useTableGrid` behavior for sorting, search, pagination, and lazy rendering.
- Confirm whether sorting is currently client-side, server-side, or mixed.
- Keep the shared `TableGrid` changes backward-compatible for existing pages.
- Prefer page-level configuration for Degree Participations-specific behavior.
- If new TableGrid capabilities are added, document which pages opt into them.

### Scoping findings

- Route entry is `frontend-nx/apps/edu-hub/pages/manage/course/[courseId].tsx`.
  It waits for `next-auth` authentication before mounting `ManageCourseContent`,
  but currently renders the inline copy `Waiting for authentication!` while
  waiting.
- Parent page logic lives in
  `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/index.tsx`.
  It runs `MANAGED_COURSE` immediately when mounted.
- `ManageCourseContent` only mounts `DegreeParticipationsTab` when
  `openTabIndex === 4`, so the dedicated Degree Participations query does not
  run while the description tab is open.
- The parent `MANAGED_COURSE` query is still broad: it fetches course
  enrollments, each enrolled user's course enrollments, attendances, sessions,
  course locations, and achievement-option records on initial page load. This
  may explain heavy loading before the Degree Participations tab is opened.
- `ManageCourseContent` returns `course_not_found` whenever
  `qResult.data?.Course_by_pk` is absent, without first checking
  `qResult.loading`. This likely causes transient `Course {id} not found`
  messages during normal loading.
- Degree Participations implementation lives in
  `frontend-nx/apps/edu-hub/components/pages/ManageCourseContent/DegreeParticipationsTab/index.tsx`.
- Its data query is `DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS` in
  `frontend-nx/apps/edu-hub/queries/courseDegree.ts`.
- The query fetches a paginated slice of `Course_by_pk.CourseEnrollments` for
  the degree course using `$limit`, `$offset`, `$filter`, and `$order_by`.
  Search is server-side because `useTableGrid` sends a GraphQL `filter`.
- `TableGrid` currently slices rows again when pagination is enabled but
  server-side sorting is not configured. Degree Participations already receives
  one page from Hasura through `useTableGrid`, so page 2 is sliced from a
  page-sized response and renders as empty. This is a production bug and is
  unrelated to the `python-functions` container.
- For each visible degree enrollment, the query also fetches that user's
  related course enrollments for courses belonging to the degree. The UI derives
  `name`, `lastApplication`, `ectsTotal`, `attendedEvents`, and
  `participations` from that nested data after the paginated result is returned.
- `DegreeParticipationsTab` filters out `REJECTED`, `APPLIED`, and `INVITED`
  statuses client-side after the query. The aggregate count currently only uses
  `$filter`, so the pagination count may include statuses the rendered rows
  remove.
- The `Total ECTS` column has `enableSorting: true`, but
  `DegreeParticipationsTab` does not pass `sorting` / `setSorting` from
  `useTableGrid` into `TableGrid`. Therefore TableGrid uses internal
  client-side sorting over the currently fetched page only.
- The `Attended Events` column is derived as `attendedEvents` but does not
  currently set `enableSorting: true`.
- Other pages use server-side sorting by destructuring `sorting` and
  `setSorting` from `useTableGrid`, passing them to `TableGrid`, and providing a
  `sortColumnMapper`. `CourseParticipationsTab` is the closest local example.
- Full-dataset sorting for `ectsTotal` and `attendedEvents` is not a simple
  column mapper change because both values are derived from nested sibling
  course enrollments after pagination. The generated Hasura order types expose
  nested aggregate ordering, but the aggregate order input does not include a
  filter for "degree courses", "achievement certificates", or `EVENTS` program
  rows.
- Likely implementation paths for full-dataset derived sorting are:
  - fetch all filtered degree participants, derive values, sort client-side,
    then page locally;
  - add a backend/database computed field or view that exposes sortable
    certificate ECTS and attended-event counts;
  - or add a dedicated query/function for this table that returns already
    enriched rows with sortable fields.

## 2. Define and add realistic development seed data

- Do this before meaningful baseline performance measurement. The current
  default seed data is too small to reproduce the production-like slowdown or
  validate full-dataset sorting behavior.
- Trace which database tables and seed files produce:
  - users,
  - course registrations / participations,
  - degree participations,
  - attended events,
  - ECTS totals,
  - and certificate eligibility inputs.
- Add or update development seed data so the local setup can create approximately 300 users.
- Include edge cases:
  - zero attended events,
  - one attended event,
  - many attended events,
  - below `12.5` ECTS,
  - exactly `12.5` ECTS,
  - and above `12.5` ECTS.
- Use the larger dataset to verify initial tab load time, sorting, search, table rendering performance, and horizontal layout.

### Seed data findings

- Default seeds live in `backend/seeds/default/initial_seeds.sql`.
- Seed docs are in `backend/seeds/README.md`; a fresh database applies the
  default SQL seed file.
- Current relevant seed volume is small:
  - `13` users,
  - `37` course enrollments,
  - `15` courses,
  - `5` course-degree links,
  - `70` sessions,
  - and `64` attendance rows.
- The default data includes a degree course, `This is a Degree` with id `7`,
  and an events course, `This is an Event` with id `8`.
- The degree links currently connect only a few courses to degree id `7`,
  so the Degree Participations table cannot represent a 300-user production-like
  dataset yet.
- For this issue, add deterministic development-only bulk data directly to the
  default seed SQL or via a clearly named included seed SQL/script. The data
  should avoid manual Hasura-console-only state so other developers can recreate
  the same performance dataset.
- Existing sequence resets at the end of `initial_seeds.sql` must be updated if
  explicit ids are added.
- Added deterministic performance seed data to
  `backend/seeds/default/initial_seeds.sql` for a new `Machine Learning Degree`
  with id `7000`.
- The new degree links 12 ML course/course-like offerings and 5 event offerings
  that mirror the production examples, including `Applied Machine Learning`,
  `From LLMs to AI Agents`, `Scientific Machine Learning`,
  `Fine-Tuning and Deployment of Large Language Models`, and
  `Coding.Waterkant` events.
- Added 300 deterministic users with a broad mix of German and international
  first/last-name combinations, using enough surname variety to avoid obvious
  repeated-family clusters in demo data.
- Added 300 degree enrollments and 1,468 related ML-degree course/event
  enrollments so the Degree Participations tab has a production-like nested data
  shape.
- Added 225 event attendance rows for linked event sessions.
- The generated data covers the requested edge cases:
  - zero ECTS,
  - below `12.5` ECTS,
  - exactly `12.5` ECTS,
  - above `12.5` ECTS,
  - zero attended events,
  - one attended event,
  - and many attended events.
- The full updated seed file was validated against local Postgres in a rolled
  back transaction.

## 3. Capture baseline behavior

- Run the page with the larger seed dataset. Measurements against the current
  tiny dataset are not meaningful because dev compilation time dominates and
  the table has too few rows.
- Record current initial loading behavior.
- Confirm whether the description tab loads Degree Participations data too early.
- Confirm whether sorting applies only to visible rows or to the full dataset.
- Record confusing loading or error messages, such as `Authentication` or `Course 158 not found`.
- Record table width and readability issues before layout changes.

## 4. Fix full-dataset sorting

Degree Participations pagination should be fixed as part of the server-side
sorting work, not as a standalone shared `TableGrid` behavior change:

- Keep the existing `TableGrid` local slicing behavior for callers that still
  pass a full local dataset.
- Convert Degree Participations to the existing server-side sorting pattern:
  destructure `sorting` and `setSorting` from `useTableGrid`, pass them to
  `TableGrid`, and provide a correct `sortColumnMapper` or equivalent query
  behavior.
- Once server-side sorting is enabled for Degree Participations,
  `TableGrid` will no longer slice its already page-sized Hasura response a
  second time because the current shared component skips local slicing when
  `isServerSideSorting` is true.
- Verify Degree Participations can navigate to page 2 and later as part of the
  sorting fix.

### Pagination decision notes

- The temporary approach of removing local row slicing from `TableGrid` was
  reverted. It fixed Degree Participations page 2, but it would break legacy
  local-data callers that rely on TableGrid for client-side pagination.
- The known local-data callers are:
  - `SessionsTab`, which receives all `course.Sessions` from `MANAGED_COURSE`,
    filters locally, sorts locally, and paginates locally.
  - `ApplicationsTab`, which receives all course enrollments from
    `MANAGED_COURSE`, filters locally, sorts locally, and paginates locally.
  - `AttendanceDataDialog`, which parses all attendance JSON rows, filters
    locally, sorts locally, and paginates locally.
- The team preference is still to move new TableGrid work toward server-side
  pagination, using pages such as `ManageOrganizationsContent` as the template.
  For this issue, avoid changing the shared TableGrid pagination contract until
  legacy local-data callers are migrated or given an explicit local-pagination
  compatibility path.
- Do not fix Degree Participations pagination by pretending sorting is
  server-side. It is acceptable to rely on `isServerSideSorting` only once the
  Degree Participations query really implements server-side sorting for the
  relevant columns.
- Chosen implementation path: add scalar computed fields to
  `CourseEnrollment` for Degree Participation rows:
  `degreeParticipationEctsTotal` and
  `degreeParticipationAttendedEventCount`.
- The computed fields intentionally do not take a `degreeCourseId` GraphQL
  argument. They derive the degree course from the current enrollment row's
  `courseId`, which is correct for the `Course_by_pk(id: degree).CourseEnrollments`
  rows used by Degree Participations and keeps the fields usable in Hasura
  `order_by`.
- Degree Participations now follows the existing server-side sorting pattern:
  `useTableGrid` owns `sorting` / `setSorting`, the page passes them to
  `TableGrid`, and `sortColumnMapper` maps only supported sortable columns.
- The displayed `Total ECTS` and `Attended Events` values are read from the same
  computed fields used for sorting, so the rendered values and sort order stay
  aligned.
- The status exclusions for `REJECTED`, `APPLIED`, and `INVITED` moved into the
  server filter. This keeps the aggregate count, pagination, search, and
  rendered rows aligned instead of filtering out rows after pagination.
- `useTableGrid` now allows one sortable column to map to multiple Hasura
  `order_by` entries. Degree Participations uses this for deterministic
  tie-breakers after metric sorts, because many rows share the same ECTS or
  event count.
- Local verification so far: Hasura exposed the new computed fields in
  `CourseEnrollment_order_by`, Apollo codegen ran successfully, `git diff
  --check`, `yarn lint`, and `yarn type-check` passed. Lint still reports the
  pre-existing `useTableGrid` hook dependency warning.
- Direct Hasura checks against Machine Learning Degree id `7000` returned
  visible rows on offset `20`, a visible aggregate count of `290` after status
  filtering, and ordered results for both `degreeParticipationEctsTotal` and
  `degreeParticipationAttendedEventCount`.

- Add ascending and descending sorting for the `Attended Events` / `Besuchte Events` column.
- Confirm whether the column value is best represented as a numeric attended-event count, a boolean attendance indicator, or a derived display value.
- Ensure sorting happens before pagination or staged rendering.
- Keep search and sorting behavior aligned: both should operate on the complete dataset.
- Verify that total ECTS sorting also applies to the complete dataset.

## 5. Defer Degree Participations loading

- Defer Degree Participations data fetching until the `degree participations` tab is selected.
- Keep the description tab lightweight and limited to the data needed for that tab.
- Avoid showing missing-course errors while course or degree data is still pending.

## 6. Improve loading and rendering performance

- Render the first page or first batch of rows immediately after the minimum required data is available.
- Decide whether additional rows should load:
  - on explicit user action,
  - automatically in the background,
  - or through existing pagination / infinite-scroll behavior if already supported.
- Prefer existing `TableGrid` pagination and page-size behavior before adding new rendering mechanics.
- If staged or background loading is needed, prefer implementing it in a page-level hook unless it clearly belongs in shared `TableGrid`.

## 7. Clean up loading states

- Use a central spinner for the tab content area.
- Replace unclear loading text such as `Authentication` with user-facing copy such as `Courses are loading`.
- Prevent `Course 158 not found` or similar missing-course errors from appearing while the course lookup is still pending.
- Add or update translation keys in both `frontend-nx/apps/edu-hub/locales/de.json` and `frontend-nx/apps/edu-hub/locales/en.json` if new copy is needed.

## 8. Improve table layout

- Review whether `Participations` should insert a line break after `passed` or after each individual participation.
- Reduce default column widths where possible.
- Consider splitting `Attended Events` into a compact numeric or summarized display.
- Consider moving wide participation details into an expandable row to reduce default table width.
- If expandable rows are introduced, make them optional and page-configurable.
- Try simpler column formatting and sizing before adding expandable row behavior.

## 9. Regression-check other TableGrid usages

- Check at least a few existing `TableGrid` consumers.
- Confirm shared sorting, pagination, and sizing changes do not alter unrelated pages unexpectedly.
- Keep Degree Participations-specific behavior page-configurable where possible.

## 10. Verification

- Verify the Degree Participations page with the larger seed dataset.
- Check:
  - attended-events sorting,
  - total ECTS sorting,
  - search behavior,
  - lazy tab loading,
  - loading states,
  - table layout,
  - and performance with approximately 300 users.
- Check at least one other TableGrid usage to ensure shared changes do not break unrelated tables.
- Run the relevant frontend lint and test commands for the touched area.
