# EduHub Design Files

## Event page redesign (`event-page-redesign-preview.html`)

### Preview (open in browser)

```bash
xdg-open design/event-page-redesign-preview.html
```

Design/UX critique of `/course/[id]` for `Program.type = EVENTS`, plus three
improvement directions. The spacing, alignment and heading-hierarchy findings
are program-type agnostic and apply to the course and degree pages too.

| Direction | Description |
|-----------|-------------|
| A · Tighten | Same structure; one 5-step spacing scale, one gutter, real `<h1>`, fact-list info card, neutral description card |
| B · Event-first hero | Hero carries title + date/time/place/language chips; info card dropped, speakers section added, sticky CTA bar |
| C · Sticky registration rail | Content left, one sticky white card right holding facts + CTA + deadline + calendar/share; collapses above the agenda on mobile |

"Before" captures at 390/1440 live in `event-page-assets/`.

Recommendation: ship A (hygiene, benefits all program types), then C.

High-fidelity Pencil frames: open Pencil in Cursor, create
`design/event-page-redesign.pen`, then ask the agent to continue (MCP requires
an active editor document).

---

## Project tile slider (`project-tile-slider.pen`)

Pencil designs for reusable project tiles, tile slider, and public project pages.

| Screen | Description |
|--------|-------------|
| Project Tiles — Explorations | Tile A (published showcase) + Tile B variants (public vs within-course CTA) |
| Project Page V1 — Showcase | Full-bleed hero, about, similar projects slider, sidebar |
| Project Page V2 — Public | Horizontal hero split, enroll card (no bookmark), markdown-split description |
| Project Page V2 — Within course | Join card with full-width "Apply to join" (no spots/capacity bar, no bookmark) |

Implementation plan: [docs/project-tile-slider.plan.md](../docs/project-tile-slider.plan.md)

Open in Pencil: `design/project-tile-slider.pen`

---

## StuJo job board (`stujo-design.pen`)

Pencil port of the stujo.net design, plus the employer dashboard and the
EduHub-side admin screens. This is the reference for `apps/stujo`.

| Screen | Description |
|--------|-------------|
| Screen - Landing | Hero, latest offers, employer teaser |
| Screen - Job List | Filter band and job rows |
| Screen - Job Detail | Facts grid, employer logo and website, description |
| Screen - Employer Dashboard | "Mein StuJo": stats tiles and postings table |
| Screen - Mein StuJo (Identitaetsleiste V2) | Dashboard header reworked as one identity row: logo, company, website link, and a single "Firmenprofil bearbeiten" entry point |
| Screen - Create Posting | Two-step posting form |
| Screen - Publish & Checkout | Order box and payment step |
| Screen - EduHub Admin Jobboerse | Credit grants, the admin counterpart |
| Job Tile Redesign v2 | Tile explorations for the EduHub tile slider |

Reusable components in the file: Button Primary, Button Ghost, Badge, Status
Chip, Site Header, Job Card, Site Footer, and the Job Tile variants.

Colours are variables themed on a `portal` axis (`stujo`, `flensburg`, `haw`),
so the same frames show each portal's branding. Use `$primary`, `$accent`,
`$text-primary`, `$text-muted`, `$text-grey`, `$border`, `$bg`, `$bg-soft` and
`$font` rather than hard-coded values.

Open in Pencil: `design/stujo-design.pen`

---

## Menu redesign (`menu-redesign-preview.html`)

### Preview (open in browser)

```bash
xdg-open design/menu-redesign-preview.html
```

Four admin-menu layout options after moving Organizations and Location addresses
into Settings. Target menu structure:

- **Persönlich**: Mein Profil, Meine Zertifikate
- **Verwaltung**: Kurse, Veranstaltungen, Degrees, Projekte, Benutzer, Experten, Kalender, Statistiken
- **Einstellungen**
- **Hilfe**: Kursleitungshandbuch, FAQ
- Logout

| Option | Description |
|--------|-------------|
| 1 · Grouped | Current light dropdown + section headers/dividers |
| 2 · Collapsible | Slim dropdown; Verwaltung expands inline |
| 3 · Hub page | Minimal dropdown + `/manage` hub with cards |
| 4 · Two-column | Mega-dropdown: personal/help left, Verwaltung right |

High-fidelity Pencil frames: open Pencil in Cursor, create
`design/menu-redesign.pen`, then ask the agent to continue (MCP requires an
active editor document).

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
