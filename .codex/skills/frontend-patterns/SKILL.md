---
name: frontend-patterns
description: Apply EduHub frontend conventions for components, layout, translations, TableGrid usage, and responsive behavior. Use when creating or refactoring frontend components or pages in the Next.js app.
---
# Frontend Patterns

Use this skill for frontend component and page work in `frontend-nx/apps/edu-hub`
and `frontend-nx/apps/stujo`.

## Core Rules

- organize code by feature, not by generic technology buckets
- check existing shared components before creating a new one
- build StuJo screens from the edu-hub components; never fork one to restyle it
- prefer composition and small focused hooks over large monolithic components
- keep user-facing text in translations, not inline strings
- make layouts and interactions work on mobile as well as desktop

## Reuse First

Before creating new UI, check:

- `components/common/`
- `components/common/dialogs/`
- `components/inputs/`
- `components/common/TableGrid/`

Common existing building blocks include:

- `ErrorMessageDialog`
- `QuestionConfirmationDialog`
- `NotificationSnackbar`
- `CreatableTagSelector`
- `DropDownSelector`
- `InputField`
- `TableGrid`

## Two Apps, One Component Set

`frontend-nx/apps/stujo` (the StuJo job board) is not a separate design
system. The apps must differ in design tokens, not in forked components, and
the amount they share is meant to grow.

- Import shared code through the `@eduhub/*` alias in `tsconfig.base.json`;
  `apps/stujo/next.config.js` enables `experimental.externalDir` for it.
- To restyle a shared component for StuJo, override the `--eduhub-*` CSS
  variables in `apps/stujo/styles/globals.css`. Every colour in
  `apps/edu-hub/tailwind.config.js` resolves to one of those variables, so a
  token change is the whole job. Copying the component instead is the thing
  this rule exists to prevent.
- Both apps use `apps/edu-hub/tailwind.config.js`. StuJo's config extends it
  and its `content` globs must include `../edu-hub/components/**`, or Tailwind
  emits no classes for a shared component and it renders unstyled.
- Tailwind preflight is off in StuJo: the app is a CSS port of the Rails site
  that relies on browser defaults. Turning it on is its own change.
- A component calling `useTranslations('common')` needs its keys in **both**
  `apps/edu-hub/locales/*.json` and `apps/stujo/locales/*.json` — separate
  namespaces.
- `variant` on `DropDownSelector` / `InputField` selects a style family, not an
  app: with shared tokens, `'eduhub'` is the right variant inside StuJo too.
- StuJo keeps its own ported layer (`--stujo-*` variables, `stujo-*` classes)
  for page chrome. That stays, and is not a reason to fork a shared component.

Background: `docs/STUJO_INTEGRATION_PLAN.md` §8.1, `AGENTS.md` rule 10.

## Component Structure

- keep feature code near the feature it serves
- extract complex logic into a custom hook when the component becomes hard to read
- avoid deep component nesting and broad prop drilling
- use TypeScript interfaces for props

## Translations

German must use the informal "Du" form.

Keep translations in `frontend-nx/apps/edu-hub/locales/` and add new keys to both:

- `de.json`
- `en.json`

Read `references/translations.md` for naming and enum-key rules.

## TableGrid

Use the shared `TableGrid` rather than reinventing table behavior.

Read `references/tablegrid.md` when:

- adding a new table
- configuring columns
- wiring search or pagination
- deciding between table and mobile-card presentation

## Responsive Behavior

- start from the smallest useful layout first
- ensure tap targets and action visibility remain usable on mobile
- when dense tables become unreadable on mobile, consider a card-like representation instead of forcing every desktop column into view

## Output Style For This Skill

When making frontend changes, mention the existing components or patterns you reused before creating anything new.
