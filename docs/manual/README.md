# EduHub manual

The user manual of EduHub, shown in the app at `/help` (German) and
`/en/help` (English). The in-app Assistant cites it, so links to its pages
must stay stable. Tests in `frontend-nx/apps/edu-hub/lib/manual/__tests__/`
check every page.

## Layout

```
docs/manual/
  de/                      # one folder per language, same files in each
    index.md               # start page → /help
    participants/
      index.md             # section intro → /help/participants
      registration.md      # page → /help/participants/registration
    organizers/
      ...
  en/                      # → /en/help/...
```

- Pages are at most one folder deep. Every folder needs an `index.md`.
- A page has the same path in every language; its slug is that path without
  the language and `.md`. Renaming a file breaks links: don't, or keep the old
  slug.

## Front matter

```yaml
---
title: Registering and applying       # in the page's language
slug: participants/registration       # path without language and .md; "" for the start page
audience: [participant]               # any of participant, organizer, admin
language: en                          # de or en, must match the folder
order: 10                             # position in its section (optional)
summary: One sentence on what the page answers.
---
```

Only flat `key: value` and `key: [a, b]` lines are read.

## Links and anchors

- Link other pages by relative file path, e.g. `[Sessions](../organizers/sessions.md#mandatory-and-optional-sessions)`.
  This works on GitHub and becomes `/help/organizers/sessions#...` in the app.
- `##` and `###` headings get an id from their text: lower case, `ä ö ü ß` →
  `ae oe ue ss`, everything else not a letter or digit → `-`
  (`headingId` in `frontend-nx/apps/edu-hub/lib/manual/markdown.ts`).

## Writing

- Write for participants, Organizers (instructors and Org Admins) and admins,
  with the terms of [`CONTEXT.md`](../../CONTEXT.md) and the labels the app
  shows (`frontend-nx/apps/edu-hub/locales/`). Put labels in **bold**.
- German uses the informal "Du".
- Describe how the platform works, not the rules of one organization
  (deadlines, certificate requirements): those stay with the organization and
  are linked from every page (`NEXT_PUBLIC_HELP_DOCS_URL`).
- Changes show up after the next build. Locally the dev container reads
  `docs/manual` on each request.
