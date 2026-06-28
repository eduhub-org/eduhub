# EduHub Design Files

## Project tile slider (`project-tile-slider.pen`)

Pencil designs for reusable project tiles, tile slider, and public project pages.

| Screen | Description |
|--------|-------------|
| Project Tiles — Explorations | Tile A (published showcase) + Tile B variants (public vs within-course CTA) |
| Project Page V1 — Showcase | Full-bleed hero, about, similar projects slider, sidebar |
| Project Page V2 — Public | Horizontal hero split, enroll card (no bookmark), markdown-split description |
| Project Page V2 — Within course | Join card with spots bar, full-width "Apply to join" (no bookmark) |

Implementation plan: [docs/project-tile-slider.plan.md](../docs/project-tile-slider.plan.md)

Open in Pencil: `design/project-tile-slider.pen`

---

## Settings redesign (`settings-redesign.pen`)

## Preview (open in browser)

```bash
xdg-open design/settings-redesign-preview.html
```

Interactive HTML mockups with three sidebar variants. High-fidelity screens
live in `settings-redesign.pen`:

| Screen | Description |
|--------|-------------|
| 00 Settings Start Page | Overview cards; clickable "Settings" title returns here |
| 01 Email Templates TableGrid | TableGrid list with chevron-right → full-page edit |
| 02 Email Template Editor | Full-page edit reusing the current EmailEditor layout (Visual/HTML toggle, toolbar, variable chips, inline preview) |
| 04 Attendance Certificates Wide | Reuses the email editor (Visual/HTML toggle, toolbar, variable chips) + A4 preview side-by-side + program type defaults |
| 05 Attendance Certificates Narrow | Same editor with HTML \| A4 Preview tabs for narrower viewports |
| 06 Project Types | Per-type achievement certificate template + default documentation instruction, links to screen 07 |
| 07 Documentation Instructions | Standard TableGrid with its built-in Add button + Search field; inline title input + project type dropdown, file download/replace, "Used by" usage count, default star; built-in red trash delete disabled for current defaults |
| 07b Delete Confirmation | Standard QuestionConfirmationDialog (DialogShell, light): title + close, plain-text body, Cancel / Delete pills — only non-defaults deletable; warns that projects using it fall back to their project type's default |

## Color tokens

All screens use the EduHub color schema (no hard-coded hex). Tokens mirror
`frontend-nx/apps/edu-hub/styles/globals.css`:

- Dark surfaces/text: `$bg-primary`, `$bg-secondary`, `$bg-card`, `$bg-deep`,
  `$border`, `$label-primary`, `$label-secondary`, `$label-muted`, `$brand`,
  `$success`, `$warning`, `$error`, `$info`, `$white`.
- Light surfaces (TableGrid rows, editors, A4 preview, dialogs use the `.light`
  theme in code): `$white` background with `$on-light-primary` (#222),
  `$on-light-secondary` (#666), `$on-light-muted` (#999), `$light-border`
  (#D8D8D8), `$light-divider` (#E5E5E5), `$light-bg-secondary` (#F2F2F2).
- Tints are avoided (Pencil fills don't support alpha): active sidebar items and
  note callouts use solid `$bg-secondary` / `$bg-card` with a `$brand` accent
  border instead of a translucent brand tint.

## Pencil (.pen) files

To generate high-fidelity `.pen` designs via the Pencil MCP:

1. Open the Pencil extension in Cursor
2. Create or open `design/settings-redesign.pen`
3. Ask the agent to continue — MCP tools require an active editor document

## Proposed sidebar structure

```
PLATFORM
  Appearance
  Homepage content (FAQ)

NOTIFICATIONS
  Email templates        [badge: count]
  Application process
  Project updates        [SOON]
  Session reminders      [SOON]
  System emails

PROGRAMS
  Certificates
  Project documentation
  Onboarding texts
  Course groups          ← moved from Homepage

SYSTEM
  Time zone
  Access & roles         [locked / SOON]
```

## Migration from current code

| Current `SettingsGroupId` | Proposed nav |
|---------------------------|--------------|
| `appearance` | Platform → Appearance |
| `homepage` | Split: FAQ → Platform; Course groups → Programs |
| `emails` | Notifications → multiple entries + tabs |
| `programDefaults` | Programs → 3 separate pages |
| `system` | System → Time zone |
| `access` | System → Access & roles |
