# Job Tile Slider — New `JOB` Content Type

> Follow-up to `docs/project-tile-slider.plan.md`. That plan introduced
> `CourseGroupOption.contentType` (`COURSE` | `PROJECT`) and the per-slider source
> selection pattern; this plan extends the same mechanism with a third content type,
> `JOB`, whose tiles show Stujo job postings and link out to the Stujo job board.
> **Planning document only — nothing here is implemented yet.**
>
> **Review decisions (2026-07-13).** The seven open questions were answered and are
> baked into the sections below; the summary lives in
> [Resolved decisions](#resolved-decisions-2026-07-13) at the end.

## Goal & UX summary

- Admins can create home sliders with `contentType = 'JOB'`, interleaved by `order`
  with course and project sliders (same `CourseGroupOption` list, same manager page).
- Each tile shows the basic information of one published Stujo job posting and is
  designed like the course/project tiles (same `TileBase` frame: image area with
  title overlay on top, info body below).
- A small **Stujo sign in the top-right corner** of the tile indicates the offer
  comes from Stujo.
- Clicking a tile opens the job's detail page **on the Stujo site in a new browser
  tab**: `https://<stujo-domain>/stellenangebote/<id>` (`target="_blank"`,
  `rel="noopener noreferrer"`) — same pattern the project widget tiles already use
  for external navigation (`ProjectTile` `isWidget` branch).

## What we reuse (grounded in current `develop`)

- **Data is already there.** The Stujo job board lives in this repo
  (`frontend-nx/apps/stujo`) and reads from the same Hasura instance. `JobPosting`
  already has an `anonymous` select permission filtered to *published, non-expired,
  unrestricted* postings (`backend/metadata/databases/default/tables/public_JobPosting.yaml`),
  including `title`, `type`, `occupation`, `location`, `region`, `featured`,
  `publishedAt`, `applicationDeadline`, `salaryText` and the `Organization`
  relationship. `Organization` exposes `name`, `logo`, `city`, `website` anonymously.
  **No permission changes are needed for the tile data.**
- **Slider config pattern**: `CourseGroupOption.contentType` + per-row selection
  junctions with a validating trigger
  (`backend/migrations/default/1780600000005_create_table_public_project_slider_selections`).
- **Frontend pattern**: `HomeProjectSlider` (per-row query + skeleton + degrade-
  gracefully-on-error), `ProjectTile` on `TileBase`, the `contentType` branch in
  `pages/index.tsx`, `ProjectSlidersManager` on the `manage/settings/course-groups`
  page, and `queries/projectSlider.ts` / `queries/projectTile.ts` as query templates.
- **Detail page & view counting**: the Stujo detail page
  (`apps/stujo/pages/stellenangebote/[id].tsx`) resolves by **numeric id** (not slug)
  and already increments the job's view counter server-side on load — no extra
  tracking is needed on the EduHub side.

## Tile design — proposed content (top → bottom)

Reuses `TileBase` (230 px image area with gradient + title overlay, 201 px body).
Suggested information, most meaningful first:

**Image area**
- Background: jobs have **no cover image**, so use a Stujo-branded fallback
  (flat brand color or subtle pattern) with the **employer logo**
  (`Organization.logo`) rendered prominently, centered-ish in the image area.
  Employers without a logo get the plain branded background.
- Bottom-left (standard `TileBase` slot): **job title**.
- **Top-right: Stujo sign** — small pill with the Stujo bird/logo and an
  external-link arrow (`ExternalLink` from lucide, matching `Calendar` usage in
  `ProjectTile`). Communicates both "from Stujo" and "opens elsewhere".

**Body (mirrors the `ProjectTile` layout rhythm)**
1. Meta row (like the published-project course line): **job type chip**
   (translated `JobPostingType`: Werkstudent:in, Praktikum, Abschlussarbeit,
   Minijob, Festanstellung, Trainee, …) left; right-aligned the **published date**
   ("Published {publishedAt}", with the small calendar icon) — matches what
   Stujo's own job list shows. *(Decision: published date only; no deadline on
   the tile, so `applicationDeadline` drops out of the tile fragment.)*
2. **Company name** — `customCompany ?? Organization.name` — as the prominent
   middle line (the slot `tagline` occupies on project tiles).
3. **Location line** — `location`, falling back to / suffixed with the translated
   `JobRegion` (e.g. "Kiel", "Schleswig-Holstein & Hamburg", "Remote"-like values
   come through `location`).
4. Footer row: translated **occupation** (Berufsfeld) as secondary text left,
   CTA right: **"View on Stujo →"** in brand color (mirrors the Tile B CTA row).

Deliberately *not* on the tile: salary/hours (inconsistent free-text, detail-page
material), tags, description, application deadline. `featured` postings are
**sorted first but look identical** to other tiles *(decision: no "Featured"
banner; `TileBase.bannerText` stays available if that changes later)*.

## Change 1 — Extend `contentType` to allow `JOB`

Migration `{ts}_alter_table_public_CourseGroupOption_allow_job_contentType`:

```sql
ALTER TABLE "public"."CourseGroupOption" DROP CONSTRAINT "CourseGroupOption_contentType_check";
ALTER TABLE "public"."CourseGroupOption"
  ADD CONSTRAINT "CourseGroupOption_contentType_check"
  CHECK ("contentType" IN ('COURSE', 'PROJECT', 'JOB'));
COMMENT ON COLUMN ... -- update to mention JOB
```

`down.sql` restores the two-value check (delete `JOB` rows first / document that it
fails while JOB rows exist). No metadata change needed — `contentType` is already in
the anonymous select columns of `public_CourseGroupOption.yaml`.

## Change 2 — Per-slider source selection: job types

Mirror the project-slider junctions with **one** junction to start with — the job
**type** is the most meaningful curation axis ("Praktika", "Abschlussarbeiten",
"Werkstudierendenjobs" make natural slider rows):

- New table `JobSliderJobType`:
  `id` serial PK, `jobSliderOptionId` int FK → `CourseGroupOption.id`
  (`ON DELETE CASCADE`), `jobType` text FK → `JobPostingType.value`,
  `UNIQUE (jobSliderOptionId, jobType)`, timestamps + `set_current_timestamp`
  trigger (copy the ProjectSlider junction migration).
- Validation trigger (mirror `check_project_slider_option_refs`): the referenced
  `CourseGroupOption` must have `contentType = 'JOB'`.
- Semantics: **no rows selected → all published jobs; rows selected → only those
  types** (union), identical to the project-slider group semantics.
- Metadata: `public_JobSliderJobType.yaml` + registration in `tables.yaml`;
  array relationship `CourseGroupOption.SelectedJobTypes`; object relationship to
  `CourseGroupOption`; **anonymous select permission** on the junction (the home
  page reads slider config logged-out). Admin manager mutations run as `admin`
  (via `useAdminMutation`), so no extra insert/delete permissions are required —
  same as the project junctions.

*(Decision: job type is the only curation axis for now.)* Occupation
(`JobOccupation`) and region (`JobRegion`) filters would follow the exact same
pattern (`JobSliderOccupation`, `JobSliderRegion`) if type-only curation turns
out too coarse — deferred.

Optional: seed one demo `JOB` slider row in `backend/seeds/default/initial_seeds.sql`
(next to the existing PROJECT slider seed) — only useful once local seeds contain
job postings (currently they don't; the stujo ETL populates real data).

## Change 3 — Stujo base URL for outbound links

The tile link must be absolute to the Stujo deployment
(`https://${local.stujo_domain}` in `infrastructure/application/08_stujo.tf`;
staging `stujo-staging.opencampus.sh`).

- Add `NEXT_PUBLIC_STUJO_URL` for the edu-hub app, with a helper
  `components/common/TileSlider/stujoBaseUrl.ts` (sibling of `widgetBaseUrl.ts`):
  env var if set, else a production fallback constant; `stujoJobUrl(id)` returns
  `${base}/stellenangebote/${id}`.
- Wire the env var wherever the other `NEXT_PUBLIC_*` vars are provided at **build
  time** for the edu frontend image (Next.js inlines them at build), plus
  `.env.development` (`http://localhost:5001` per `apps/stujo/.env.development`).
- *(Decision: yes to attribution.)* `stujoJobUrl(id)` appends
  `?utm_source=eduhub` to every tile link so Stujo analytics can distinguish
  EduHub-referred views from organic ones.

## Frontend changes (apps/edu-hub)

1. **Queries**
   - `queries/jobSlider.ts` (mirror `projectSlider.ts`): `ADMIN_JOB_SLIDERS`
     (rows where `contentType = "JOB"` + `SelectedJobTypes`), `INSERT_JOB_SLIDER`
     (inserts with `contentType: "JOB"`, `sliderGroup: true`), `DELETE_JOB_SLIDER`,
     `INSERT_JOB_SLIDER_JOB_TYPE` / `DELETE_JOB_SLIDER_JOB_TYPE`. Job types for the
     picker come from a small `JobPostingType` query (or a hardcoded enum list —
     the enum table is stable; prefer querying it like stujo does).
   - `queries/jobTile.ts`: lean `JobTileFragment` — `id`, `title`, `type`,
     `occupation`, `location`, `region`, `featured`, `publishedAt`,
     `Organization { id name logo }`. Queries `HOME_JOB_TILES_ALL`,
     `HOME_JOB_TILES_BY_TYPES($types: [JobPostingType_enum!]!)` and
     `HOME_JOB_TILES_BY_ORGANIZATION($organizationId: Int!)` (widget scoping,
     mirrors `HOME_PROJECT_TILES_BY_ORGANIZATION`), all
     `order_by: [{featured: desc}, {publishedAt: desc}]` (same ordering the
     stujo list page uses), `limit` default ~24, run with
     `context: { role: AuthRoles.anonymous }`. *(Decision: anonymous role for
     everyone, including logged-in users — university-restricted postings never
     appear on the homepage; they stay discoverable on Stujo itself.)*
   - Extend `COURSE_GROUP_OPTIONS` in `queries/courseGroupOptions.ts` with
     `SelectedJobTypes { id jobType }`.
   - Regenerate types (`/regenerate-types` workflow: Hasura up, `yarn apollo`).

2. **Components** (`components/common/TileSlider/`)
   - `TileBase.tsx`: add an optional `cornerBadge?: ReactNode` rendered in the
     existing top-right slot (where `bannerText` renders) so the Stujo sign reuses
     the frame instead of forking it. Also allow rendering without a cover photo
     (branded fallback background + centered logo node) — smallest option: an
     optional `imageArea?: ReactNode` override; alternative: keep `TileBase`
     untouched and give `JobTile` its own image area markup. Decide in review;
     recommendation: `cornerBadge` in `TileBase`, custom image content via a new
     optional prop, since projects/courses keep working unchanged (both props
     default to today's behavior).
   - `StujoSign.tsx`: small pill (Stujo bird + "Stujo" + external-link icon).
     Copy `apps/stujo/public/stujo_bird.png` (or the header logo) into
     `apps/edu-hub/public/images/stujo/`.
   - `JobTile.tsx`: renders the content from the design section above inside an
     `<a href={stujoJobUrl(job.id)} target="_blank" rel="noopener noreferrer">`.
     Translated labels via a new `job` i18n namespace.
   - `HomeJobSlider.tsx` (mirror `HomeProjectSlider.tsx`): picks
     `HOME_JOB_TILES_ALL` vs `_BY_TYPES` from `option.SelectedJobTypes`, renders
     heading + `TileSlider items={jobs} renderTile={(job) => <JobTile job={job} />}`,
     skeleton while loading, `console.warn` + render nothing on error, hide when
     empty.

3. **Home page** (`pages/index.tsx`): in the `homeSliders` memo, branch
   `option.contentType === 'JOB'` → `{ kind: 'job', option }` and render
   `<HomeJobSlider option={...} title={sliderLabel(option.title)} />` in
   `renderHomeSliders()` — three-way branch alongside `project` and `course`.

4. **Admin manager**: `ManageAppSettingsContent/JobSlidersManager.tsx` (mirror
   `ProjectSlidersManager.tsx`): add slider by title, delete, and a single
   checkbox column of job types (translated) instead of the two group columns;
   "no selection = all published jobs" hint. Mount it in
   `pages/manage/settings/course-groups.tsx` below `ProjectSlidersManager`.

5. **i18n** (`locales/de.json`, `locales/en.json`):
   - `job.*`: tile strings (`view_on_stujo`, `apply_by`, `published_on`, …).
   - `jobType.*` / `jobOccupation.*` / `jobRegion.*` labels — copy from
     `apps/stujo/locales/{de,en}.json` (keys match the enum values).
   - `manageAppSettings.job_sliders.*` (mirror `project_sliders.*`).

6. **Widget** *(decision: in scope)*: `pages/widget/jobs.tsx` mirroring
   `widget/projects.tsx`:
   - Same chrome/scaffolding: `WidgetSliderShell`, `useWidgetChrome`,
     `useWidgetLocale`, `WIDGET_ANONYMOUS_CONTEXT`.
   - `apiKey` query param → `useWidgetApiKey` resolves an `organizationId`;
     with a key the widget shows **that organization's postings**
     (`HOME_JOB_TILES_BY_ORGANIZATION`), without one all published postings
     (`HOME_JOB_TILES_ALL`).
   - `group` / `groups` query params select JOB slider rows (by
     `CourseGroupOption` order/id, as the project widget does) and narrow the
     result to the union of those rows' `SelectedJobTypes` — a small
     `filterJobsByWidgetSliders` helper analogous to
     `helpers/filterProjectsByWidgetGroups.ts`.
   - Tiles render with the same `JobTile` (already `target="_blank"` +
     absolute Stujo URL, so nothing extra is needed for iframe embedding).
   - New i18n keys `widget_error_loading_jobs` / `widget_no_jobs_available`;
     document the embed in `pages/widget/README.md`.

## Ordering & behavior notes

- Slider content order: `featured desc, publishedAt desc` — featured postings
  first, then newest; fully dynamic like the project sliders (no manual curation).
- Expired (`expiresAt`) and restricted postings never appear — enforced by the
  existing anonymous Hasura permission, not by the query.
- Empty slider rows disappear from the homepage (same as project sliders), so a
  "Praktika" slider with zero published internships costs nothing visually.

## Downstream / verification

- Regenerate GraphQL types after schema + query changes (`/regenerate-types`).
- Function impact scan: `rg "contentType|CourseGroupOption" functions/` — the
  check-constraint widening is additive; no function reads `contentType` today.
- Tests: component test for `JobTile` (renders type/company/location/deadline,
  anchor has `target="_blank"` + `rel`, Stujo sign present) — there is no
  `ProjectTile` test to extend, so this would be the first tile test.
- Manual verification via the local stack (`/start-dev`): create a `JOB` slider in
  *Manage → Settings → Course groups*, insert a couple of `PUBLISHED` job postings
  (SQL or stujo employer flow), check homepage slider + new-tab navigation to
  `localhost:5001/stellenangebote/<id>?utm_source=eduhub`. For the widget: load
  `/widget/jobs` bare, with `groups=`, and with an `apiKey` of a job-board-enabled
  organization; verify org scoping and that tiles open Stujo in a new tab from
  inside an iframe.

## Resolved decisions (2026-07-13)

| # | Question | Decision |
|---|----------|----------|
| 1 | Curation axes for a job slider | **Job type only** (`JobSliderJobType`); occupation/region junctions deferred |
| 2 | Tile image area | **Stujo-branded background + employer logo** (no cover images exist for jobs) |
| 3 | Date on tile | **Published date only** (`publishedAt`; no deadline on the tile) |
| 4 | Featured postings | **Sorted first only**, visually identical (no banner) |
| 5 | Logged-in visibility | **Anonymous role everywhere** — university-restricted postings stay off the homepage |
| 6 | UTM attribution on outbound links | **Yes, `?utm_source=eduhub`** |
| 7 | Jobs widget for partner sites | **In scope** — build `pages/widget/jobs.tsx` alongside the homepage slider |

## Implementation todos (in order)

1. Migration: widen `contentType` check to include `JOB` (+ comment).
2. Migration: `JobSliderJobType` junction + validation trigger; metadata
   (`public_JobSliderJobType.yaml`, `tables.yaml`, `CourseGroupOption.SelectedJobTypes`
   relationship, anonymous select perms).
3. `NEXT_PUBLIC_STUJO_URL` + `stujoBaseUrl.ts` helper (dev/staging/prod values).
4. Queries: `jobSlider.ts`, `jobTile.ts`, extend `COURSE_GROUP_OPTIONS`; regenerate
   types.
5. Components: `TileBase` `cornerBadge`/image-area props, `StujoSign`, `JobTile`,
   `HomeJobSlider`; copy Stujo logo asset.
6. Wire `pages/index.tsx` `JOB` branch.
7. `JobSlidersManager` + mount on the course-groups settings page.
8. `pages/widget/jobs.tsx` + `filterJobsByWidgetSliders` helper + widget README
   entry.
9. i18n keys (de/en), reusing stujo's enum label translations; widget
   error/empty strings.
10. `JobTile` component test; manual end-to-end check with the local stack.
