# EduHub MCP server (course setup)

The course-setup operations of ADR 0006 (`docs/adr/0006-course-setup-mcp-server.md`),
served at `POST /api/mcp` (MCP Streamable HTTP, stateless, JSON responses).

| File | What it does |
|------|--------------|
| `operations.ts` | The operations and their rules; every write returns a Proposed Change |
| `proposals.ts` | Signing/verifying Proposed Changes and the staleness fingerprint |
| `hasuraCourseStore.ts` | Hasura access with the caller's token and role (never the admin secret) |
| `server.ts` | MCP tool definitions (zod schemas) over the operations |
| `setupGuides.ts` | Per program type (events, courses, degrees): what to ask before drafting (`get_setup_guide`) |
| `metrics.ts` | Anonymous counters: proposals created / applied per kind |
| `../../pages/api/mcp.ts` | The HTTP endpoint |

## Auth

Send `Authorization: Bearer <Keycloak access token>` (the token NextAuth holds for
the user) and optionally `x-hasura-role` (`instructor`, `org_admin`, `admin`).
Without the header, the most capable of those roles in the token is used. Hasura
checks the token and role on every call; the server adds no rights of its own.

## Rules

- Instructors manage the courses they teach; Org Admins the courses of their
  organization's programs (by capability); admins all.
- Only Org Admins (with the capability for the program type, or
  canManageSettings) and admins can create courses, in the programs
  `list_programs` returns. A new course gets the defaults of "add" on the manage
  courses page (empty tagline, DE, the program's application end or today, 2
  missable Sessions, ONLINE).
- Course titles are unique within a course or degree program (ignoring case and
  surrounding spaces), when creating a course and when renaming one, at propose
  and apply (`TITLE_TAKEN`). This also stops a second apply of the same create
  proposal there. Event programs are exempt: the same event runs again each year
  under its title. The manage courses page enforces the same rule
  (`helpers/courseTitles.ts`).
- Sessions can only be proposed **and applied** while the course has no
  Registrations in any state.
- Apply refuses a proposal whose part of the course (texts/settings, or the
  Sessions) changed since it was proposed (`STALE`), one made by another user or
  role, an altered one, and one older than 24 hours.
- Settings a role can't update in Hasura (e.g. `applicationEnd` for instructors)
  are refused at propose, read from Hasura's schema for that role.
- Course mails (`get_mail_templates`, `propose_mail_template`): the mails a
  course sends for its registration type, as on the course's email templates
  section (`utils/getEditableEmailTemplateTypes.ts`), each from the course's own
  copy or the default. Instructors read them; only Org Admins and admins change
  them (as in `public_MailTemplate.yaml`). A change of a default is applied as
  the course's own copy with the default's sender, cc and bcc; only subject and
  text can be changed. Apply refuses it when the course's copy appeared or
  changed since the proposal (`STALE`). Instructors can't read the registration
  type of an unpublished course, so they get the mails of every type.

Errors are tool results with `isError: true` and
`{"error": {"code": "...", "message": "..."}}`.

## Try it with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Choose "Streamable HTTP", URL `http://localhost:5000/api/mcp`, and add the
headers `Authorization: Bearer <token>` and `x-hasura-role: instructor`.

## Differences from the provider-trial mock tools

The trial's `scripts/assistant-provider-trial/tools.json` (branch
`claude/assistant-provider-trial`) has mock versions of these tools. To rerun the
trial with the real list:

- `get_course`: same parameters; the result also has `updatedAt`,
  `sessionsChangeable`, `courseLocations` and the Sessions' `locations`.
  `language` is the database value (`DE` / `EN`).
- `propose_course_texts`: `language` is optional and must match the course
  language, because a course has one set of texts.
- `propose_course_settings`: adds `sessionReminderLeadHours` (Reminder Lead Time).
- `propose_sessions`: `sessions` (new Sessions) as in the trial, each with
  optional `locations`; adds `changes` and `deleteSessionIds`.
- The result field `proposedChangeId` is the signed token to pass to
  `apply_proposed_change`; the mock returned a short id.
- New: `list_courses`, `list_programs`, `get_registration_count`,
  `propose_create_course`, `apply_proposed_change`, `discard_proposed_change`,
  `get_setup_guide`, `get_mail_templates`, `propose_mail_template`.

## Not in v1

- People actions, sending emails, OAuth for external clients (v2).

## Accepted limits

Apply re-reads the course, checks the rules and then writes in a separate
request, so something that commits in those few milliseconds is not caught:
another Organizer's edit to the same Session, a course's first Registration, a
second apply of the same create proposal fired at the same instant (the widget
disables Apply while a request runs), or a course created with the same title.
These were judged too unlikely and too harmless to need database-level locking.

