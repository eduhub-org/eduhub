# Course page — section-title & table-width fix (dev handoff)

Implements the two layout changes approved on the mock
(`ui_kits/web/course-enrolled.html`):

1. **All section titles formatted equally** — same size, same weight, same colour,
   and aligned to the **same left edge**.
2. **The "Projekte in diesem Kurs" table spans the full section width** — matching
   the cards above (Mein Projekt) and below (Anwesenheiten).

Target app: `frontend-nx/apps/edu-hub` in `eduhub-org/eduhub`.
All paths below are relative to that app folder.

---

## Root cause

The course page (`components/pages/CourseContent/`) renders one section per child
component, and each component invents its own heading — **five different
treatments**, at **different nesting depths**:

| Section | File | Current heading | Effective left inset* |
|---|---|---|---|
| Mein Projekt | `Projects/MyProjectPanel.tsx` | `<h3 className="text-lg font-semibold">` | `px-8` card → `p-6` panel ≈ **56px** |
| Projekte in diesem Kurs | `Projects/index.tsx` | `<h2 className="text-2xl font-semibold …">` | `px-8` ≈ **32px** |
| Anwesenheiten | `Attendances.tsx` | `<BlockTitle>` (≈ text-5xl) | inside `ContentRow px-8` ≈ **32px** |
| Das wirst du lernen | `LearningGoals.tsx` | `<span className="text-3xl font-semibold mb-9">` | `PageBlock` |
| Termine | `Sessions.tsx` | `<span className="text-3xl font-semibold mt-24">` | `PageBlock` |

\* relative to the `max-w-screen-xl` column. Different sizes **and** different left
edges → the ragged look in the screenshot.

The table looks narrow because it lives in `Projects/index.tsx` inside a
`px-8` wrapper (content width), while the white cards' **backgrounds** run to the
full column width. Same content width, but the cards *read* wider because they're
filled.

---

## The fix — one heading component, hoisted above full-width bodies

**Pattern:** every section becomes, as a direct child of the
`max-w-screen-xl mx-auto w-full` column:

```tsx
<SectionTitle>…</SectionTitle>
<div className="…full-width card or table…">…</div>
```

Titles are no longer nested inside a card's inner padding, so they all share one
left edge; bodies/tables all run full column width.

### 0. New shared component
Add **`components/common/SectionTitle.tsx`** (provided in this folder). One size
(`text-3xl`), one weight (`font-semibold`), one colour (`text-label-primary`),
one margin (`mb-6`).

### 1. `components/pages/CourseContent/Projects/index.tsx`
- Import it: `import { SectionTitle } from '../../../common/SectionTitle';`
- Hoist the **Mein Projekt** title above its card and drop the inner `<h3>`
  (see step 3). Replace the `text-2xl` h2 with `<SectionTitle>`, and **remove the
  `px-8` wrapper around the table** so it spans the full width.

```diff
-      {showMyProjectPanel && userId ? (
-        <ContentRow className="mb-8 text-label-primary bg-fill-primary light px-8 py-8 w-full min-w-0">
-          <div className="flex flex-col w-full min-w-0">
-            <MyProjectPanel … />
-          </div>
-        </ContentRow>
-      ) : null}
-
-      <div className="w-full min-w-0 px-8">
-        <h2 className="text-2xl font-semibold text-label-primary mb-6">
-          {t('projects.section_heading')}
-        </h2>
-        <ProjectsTable … />
-      </div>
+      {showMyProjectPanel && userId ? (
+        <>
+          <SectionTitle>{t('projects.my_project.heading')}</SectionTitle>
+          <ContentRow className="mb-12 text-label-primary bg-fill-primary light px-8 py-8 w-full min-w-0">
+            <div className="flex flex-col w-full min-w-0">
+              <MyProjectPanel … />
+            </div>
+          </ContentRow>
+        </>
+      ) : null}
+
+      <div className="w-full min-w-0">
+        <SectionTitle>{t('projects.section_heading')}</SectionTitle>
+        <ProjectsTable … />   {/* full column width — no px-8 inset */}
+      </div>
```

### 2. `components/pages/CourseContent/Projects/MyProjectPanel.tsx`
The panel's first row holds the title **and** the action buttons. Drop the title
(now rendered above the card by step 1) and keep the buttons right-aligned.

```diff
-      <div className="flex flex-wrap items-center justify-between gap-3">
-        <h3 className="text-lg font-semibold">{t('projects.my_project.heading')}</h3>
-        <div className="flex flex-wrap items-center gap-2">
+      <div className="flex flex-wrap items-center justify-end gap-3">
+        <div className="flex flex-wrap items-center gap-2">
           {/* …action buttons unchanged… */}
         </div>
       </div>
```

### 3. `components/pages/CourseContent/Attendances.tsx`
Swap the oversized `BlockTitle` for `SectionTitle`. Since the title should sit
above the white card (not inside it), the cleanest option is to **remove the title
here** and render it in `CourseContent/index.tsx` just before the attendances
`ContentRow` (step 5). If you prefer the smallest change, just swap in place:

```diff
-import { BlockTitle } from '@opencampus/shared-components';
+import { SectionTitle } from '../../common/SectionTitle';
…
-      <div className="mb-2">
-        <BlockTitle>{t('attendances.attendances')}</BlockTitle>
-      </div>
+      <SectionTitle>{t('attendances.attendances')}</SectionTitle>
```

### 4. `Sessions.tsx` and `LearningGoals.tsx`
Replace the bespoke `text-3xl font-semibold` spans with `<SectionTitle>` so they
use the identical component (keep their surrounding margin via the optional
`className`, e.g. `mt-24` on Sessions):

```diff
- <span className="text-3xl font-semibold mt-24">{ …date_plural… }</span>
+ <SectionTitle className="mt-24">{ …date_plural… }</SectionTitle>
```
```diff
- <span className="text-3xl font-semibold mb-9">{t('learning.you_will_learn')}</span>
+ <SectionTitle className="mb-9">{t('learning.you_will_learn')}</SectionTitle>
```

### 5. `components/pages/CourseContent/index.tsx` (alignment)
For true edge alignment, render each section's `SectionTitle` as a **direct child
of the `max-w-screen-xl mx-auto w-full` column**, immediately before that section's
card/`ContentRow` — rather than inside the card. This is already handled for
Projects (step 1); do the same for the Attendances block if you take the "remove
title from `Attendances.tsx`" route in step 3:

```tsx
<SectionTitle>{t('attendances.attendances')}</SectionTitle>
<ContentRow className="mb-24 text-label-primary bg-fill-primary light px-8 py-8">
  {/* …Attendances + AchievementRecord… */}
</ContentRow>
```

---

## Result
- One `<SectionTitle>` → identical size/weight/colour everywhere.
- All titles sit at the column's left edge (no `px-8`/`p-6` nesting offset).
- The projects table runs full column width, matching the cards above and below.

## Notes / please verify in dev
- I derived these edits from the source (read-only) and **could not compile or run
  them**. Run through your normal lint/test/PR flow.
- The Attendances block shares a `ContentRow` with `AchievementRecord`; confirm the
  hoisted title reads well when both are present (the screenshot showed attendances
  only).
- `text-3xl` was chosen to match the approved mock and the existing
  Sessions/Learning headings. If you prefer `text-2xl`, change it once in
  `SectionTitle.tsx`.
- Visual spec: `ui_kits/web/course-enrolled.html` (the teal “unified title” badges
  are annotation only — not part of the change).
