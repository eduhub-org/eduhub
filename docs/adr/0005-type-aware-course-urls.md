# ADR 0005: A course's URL segment follows its program type

## Status
Accepted

## Context

A Course is anything people register for: a course, an event or a degree
(`CONTEXT.md`). Which of the three it is comes from `Program.type`, and one page
renders all of them — `components/pages/CourseContent/` publicly,
`components/pages/ManageCourseContent/` for organizers.

Both lived at a single path. An event was published at `/course/42` and managed
at `/manage/course/42`:

- Every link an attendee sees, copies or shares says "course", whatever they are
  looking at.
- The events RSS and iCal feeds (`pages/api/events/rss.ts`,
  `pages/api/events/ical.ts`) syndicate an events-only listing to external
  portals such as wasgehtinkiel.de, in which every single link read
  `/course/:id`.
- Organizers reach events through `/manage/events` and landed on
  `/manage/course/42`.

The pull in the other direction is that `CONTEXT.md` is explicit that an Event
"follows every Course rule; it is not a separate concept", and the project has
already declined to split behaviour by program type once:
`_Avoid_: event confirmation vs. course confirmation as separate emails`.

## Decision

The URL segment of a Course follows its `Program.type`:

| Program type | Public       | Organizer            |
|--------------|--------------|----------------------|
| `COURSES`    | `/course/:id`| `/manage/course/:id` |
| `EVENTS`     | `/event/:id` | `/manage/event/:id`  |
| `DEGREES`    | `/degree/:id`| `/manage/degree/:id` |

**This splits the address only.** There is still one page, one component tree
and one set of rules per surface; the route files are re-exports of
`CourseContent/courseRoute.tsx` and `ManageCourseContent/manageCourseRoute.tsx`.
Nothing about an Event's behaviour forks from a Course's, and this decision is
not a licence to start forking it. "Course" also remains the umbrella term in
code, as `CONTEXT.md` requires — `helpers/coursePath.ts`, not `offeringPath.ts`.

Every segment keeps serving every Course, and the one that does not match the
program type sends the visitor to the one that does, so no existing link breaks:

- **Public**: a 307 from `getServerSideProps`. The SEO query already selects
  `Program.type` for the JSON-LD, so the check costs no extra request. It is
  temporary, not permanent, because an organizer can move a course into a
  program of another type and a 308 would outlive that in browser caches.
  Consolidating the three paths for crawlers is the `rel=canonical` tag's job,
  and that tag is built from the program type too.
- **Organizer**: a client-side `router.replace` once the course loads. That page
  has no `getServerSideProps` — it is gated on the session and loads through an
  authed hook — so a server redirect would mean an authed server-side query for
  a page no crawler ever sees.

## Consequences

- `/course/:id` and `/manage/course/:id` keep working indefinitely. Backend link
  generators (`emailTemplateVariables.js`, `sendCourseUpdateEmail`,
  `guestRegistration.js`, `sendOrganizerAddedEmail`), the Stripe checkout return
  URLs and the MOOCHub feed (`functions/apiProxy/main.py`) still emit
  `/course/:id` and are redirected. Threading the program type into them so
  shared links read correctly first time is a worthwhile follow-up, not a
  requirement.
- Links are built through `helpers/coursePath.ts` rather than inline. Its
  segment falls back to `course`, so a call site that has no `Program.type`
  loaded still produces a working link.
- Two redirect details are load-bearing and covered by tests: the query string
  survives (the MOOCHub feed identifies itself with `?source=moochub&…`), and so
  does the locale — Next applies `basePath` to a `getServerSideProps` redirect
  but never the locale prefix, which would drop an English visitor into German.
- The sub-routes `/course/:id/payment-{success,cancelled}` and
  `/course/:id/project/:id` stay under `/course/`. They are transactional rather
  than shared, the Stripe URLs are built backend-side, and projects have their
  own canonical `/project/:id`.
- The six route files map one-to-one onto App Router pages when
  `docs/APP_ROUTER_MIGRATION_PLAN.md` batches 2 and 3 land; the public redirect
  then moves into `proxy.ts`, where it costs no render.
