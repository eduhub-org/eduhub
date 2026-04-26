---
name: frontend-patterns
description: Apply EduHub frontend conventions for components, layout, translations, TableGrid usage, and responsive behavior. Use when creating or refactoring frontend components or pages in the Next.js app.
---
# Frontend Patterns

Use this skill for frontend component and page work in `frontend-nx/apps/edu-hub`.

## Core Rules

- organize code by feature, not by generic technology buckets
- check existing shared components before creating a new one
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
