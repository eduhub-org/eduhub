# PR package — unify course-page section titles & full-width projects table

I (the design agent) can't push to GitHub from my environment — it's read-only.
This file gives Claude Code (or any engineer) everything to open the PR in one step.

---

## Branch
```
fix/course-page-section-titles
```

## Commit message
```
fix(course): unify section titles and widen projects table

Replace the five different course-page heading treatments (text-lg,
text-2xl, BlockTitle, text-3xl) with one shared <SectionTitle>, hoist
titles above their cards so they share one left edge, and let the
"Projekte in diesem Kurs" table span the full column width to match the
cards above and below.
```

---

## Paste this to Claude Code (run inside the eduhub repo)

> Apply the layout fix described in `code-handoff/course-page-layout/DIFF.md`
> (also pasted below). Steps:
> 1. Create `frontend-nx/apps/edu-hub/components/common/SectionTitle.tsx` from
>    `code-handoff/course-page-layout/SectionTitle.tsx`.
> 2. In `components/pages/CourseContent/Projects/index.tsx`: import `SectionTitle`,
>    render `<div className="px-8"><SectionTitle>{t('projects.my_project.heading')}</SectionTitle></div>`
>    above the MyProjectPanel `ContentRow`, replace the `text-2xl` h2 with
>    `<div className="px-8"><SectionTitle>{t('projects.section_heading')}</SectionTitle></div>`,
>    and remove the `px-8` from the wrapper around `<ProjectsTable>` so the table
>    is full column width.
> 3. In `components/pages/CourseContent/Projects/MyProjectPanel.tsx`: delete the
>    inner `<h3 …>{t('projects.my_project.heading')}</h3>` and change that row's
>    `justify-between` to `justify-end` (the action buttons stay).
> 4. In `components/pages/CourseContent/Attendances.tsx`: replace the
>    `import { BlockTitle } from '@opencampus/shared-components'` + `<BlockTitle>`
>    usage with `import { SectionTitle } from '../../common/SectionTitle'` and
>    `<SectionTitle>{t('attendances.attendances')}</SectionTitle>`.
> 5. (Optional, for full consistency) In `Sessions.tsx` and `LearningGoals.tsx`
>    swap the `text-3xl font-semibold` span for `<SectionTitle className="…">`.
> Then run lint + typecheck, fix any issues, commit on branch
> `fix/course-page-section-titles`, and open a PR with the title/body below.

---

## PR title
```
Unify course-page section titles & widen projects table
```

## PR description (markdown)
```md
## What
Makes every section title on the logged-in course page identical in size, weight
and colour, aligned to the same left edge — and widens the "Projekte in diesem
Kurs" table to the full column width so it matches the cards above (Mein Projekt)
and below (Anwesenheiten).

## Why
The page rendered **five different heading treatments** at different nesting
depths (`text-lg` for Mein Projekt — buried in a `px-8` card → `p-6` panel —
`text-2xl` for Projekte in diesem Kurs, the oversized `BlockTitle` for
Anwesenheiten, and `text-3xl` for Termine / "Das wirst du lernen"). The projects
table also sat inside a `px-8` inset, so it read narrower than the filled cards
around it.

## How
- New shared `components/common/SectionTitle.tsx` — one `text-3xl font-semibold
  text-label-primary mb-6` heading used everywhere.
- Titles hoisted above their cards (consistent `px-8` inset) instead of nested
  inside card padding → shared left edge.
- Removed the `px-8` inset on the projects table → full column width.

## Visual spec
Approved mock: see the design-system handoff (`ui_kits/web/course-enrolled.html`).

## Files
- `components/common/SectionTitle.tsx` (new)
- `components/pages/CourseContent/Projects/index.tsx`
- `components/pages/CourseContent/Projects/MyProjectPanel.tsx`
- `components/pages/CourseContent/Attendances.tsx`
- `components/pages/CourseContent/Sessions.tsx` (optional)
- `components/pages/CourseContent/LearningGoals.tsx` (optional)

## Test
- [ ] Logged-in course page: Mein Projekt / Projekte in diesem Kurs /
      Anwesenheiten / Termine titles are identical size & left-aligned.
- [ ] Projects table spans the full width of the cards above and below.
- [ ] No regressions for degree courses / event courses.
```

---

## If you'd rather use the CLI directly
```bash
git checkout -b fix/course-page-section-titles
# …apply the edits from DIFF.md (or have Claude Code do it)…
git add -A
git commit -m "fix(course): unify section titles and widen projects table"
git push -u origin fix/course-page-section-titles
gh pr create --title "Unify course-page section titles & widen projects table" --body-file <(sed -n '/^## PR description/,/^---/p' code-handoff/course-page-layout/PR.md)
```
