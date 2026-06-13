# EduHub by opencampus.sh — Design System

A design system for **EduHub**, the community learning platform built by
[opencampus.sh](https://opencampus.sh) (operated by Campus Business Box e.V. in Kiel, Germany).
EduHub centralizes educational offerings: people apply to and get accepted into courses,
organize course information, manage project results, and earn certificates and micro-degrees.
Its current focus is on application & event-registration flows and on strengthening
**learning communities** (including a Mattermost-based chat integration).

> Tagline in the product hero: **"Start Hacking — Your Life."**

This folder gives a design agent everything needed to produce on-brand EduHub
interfaces, mockups, slides and assets: real logos and imagery, the exact color &
type tokens lifted from the codebase, documented visual/content rules, and a
high-fidelity UI kit recreation of the product.

---

## Sources

Everything here was reverse-engineered from the public EduHub codebase. The reader is
**encouraged to explore these repositories** to build richer, more accurate designs:

- **Primary repo — `eduhub-org/eduhub`** (branch `develop`): https://github.com/eduhub-org/eduhub
  - The Next.js front-end lives at `frontend-nx/apps/edu-hub/`.
  - Tokens: `styles/globals.css` (CSS custom properties) + `tailwind.config.js` (semantic color map, font family).
  - **Authoritative styling rule:** `frontend-nx/apps/edu-hub/.cursor/rules/theme-and-styling.mdc`
    — mandates that all colors be consumed as **semantic `--eduhub-*` CSS variables** (never
    hardcoded hex), and that light-on-dark sections carry the `.light` class which *inverts* those
    same tokens. This design system follows that rule: `colors_and_type.css` is the single source of
    truth and `ui_kits/web/styles.css` consumes the tokens (literals are reserved only for
    white text over photos and black photo-protection gradients, matching the product).
  - Components mined: `components/layout/{Header,Footer,Menu}.tsx`, `components/common/{Button,Card}.tsx`,
    `components/common/TileSlider/{Tile,TileBase}.tsx`, `pages/index.tsx`, `pages/course/[courseId].tsx`,
    `components/pages/CourseContent/index.tsx`.
  - **MUI theme verified:** `config/theme.ts` was cross-checked against these tokens — brand, secondary,
    error/success/warning, `background.default`/`paper`, `text.primary`/`secondary` and the
    `"Space Grotesk"` family all match exactly. MUI also sets `MuiButton.textTransform: 'none'`
    (buttons are never uppercased) and forces dialogs to white `#fff`/`#222` (equivalent to the
    `.light` token flip used here).
  - Copy lifted from `locales/en.json`.
- **Org docs / related** (context, not directly used): `eduhub-org/documentation`, `opencampus-sh/edu-plattform-docu`.
- The platform: **https://edu.opencampus.sh**

Tech stack (for context): Next.js + React, Tailwind CSS, Keycloak (auth), Hasura + Apollo (GraphQL),
serverless functions (Python/Node). Licensed AGPLv3.

---

## CONTENT FUNDAMENTALS

How EduHub writes.

- **Voice: direct, energetic, slightly playful and activist.** The hero literally reads
  *"Start Hacking / Your Life"* — learning is framed as taking agency, not consuming content.
  Stickers on the brand photo say things like *"KEINE PANIK!"* ("don't panic"). It is warm and
  encouraging, never corporate.
- **Address: second person ("you" / "your").** "Find your courses", "Continue Learning!",
  "Start Hacking Your Life". The product speaks *to* the learner. First person plural ("we")
  appears in community/contributor contexts ("We welcome contributions").
- **Bilingual, German-first org, English-equal.** The app ships full **EN | DE** parity with a
  header language toggle. German is the operating language of opencampus.sh (Kiel); English copy
  is first-class, not an afterthought. When in doubt, write copy that translates cleanly.
- **Casing: sentence case for UI, Title Case for short calls-to-action.** Buttons: "Register now",
  "Upload". Section headings: "Find your courses", "Continue Learning!". The footer wordmark is the
  only all-caps moment ("EDU HUB").
- **Punchy, short labels.** Nav and buttons are 1–3 words: "Profile", "My Certificates",
  "Programs", "Experts", "Logout", "browse". Exclamation marks used sparingly for warmth
  ("Continue Learning!").
- **Concrete, benefit-led marketing copy.** SEO/marketing strings name the actual fields:
  *"your platform for tech, business, and creative courses. Learn coding, entrepreneurship, and more
  in our vibrant Community of Learning."* Note the recurring phrase **"Community of Learning"** —
  community is the core promise.
- **No emoji in product UI.** The repo README uses GitHub shortcode emoji (:mortar_board:) for
  decoration, but the shipped interface does **not** use emoji. Don't add them to EduHub designs.
- **Status & system messages are plain and human.** e.g. *"Your session has expired. Please log in
  again to continue."*, *"Extended application period"*. Clear, no jargon.

---

## VISUAL FOUNDATIONS

The look and feel.

### Overall vibe
A **dark, confident, photography-forward** interface. The page sits on near-black charcoal
(`#222` → `#0F0F0F`), big bright photography fills the hero edge-to-edge, and a single
energetic teal-green (`#00A398`) is the brand accent. It reads modern, techy and youthful —
closer to a startup/maker community than a traditional academic LMS. Content cards flip to
**light** (white) so course imagery and text pop against the dark page.

### Color
- **Brand teal-green `#00A398`** is the one accent — used for hover/focus, active states, the
  active calendar day, and interactive emphasis. Light/dark variants `#00C4B8` / `#008078`.
- **Dark surfaces** are the default: page `#222222`, raised `#333333`, cards `#2a2a2a`,
  deep black `#0F0F0F` (footer + the floor of the hero gradient).
- **Light surfaces** (`.light` scope) for tile bodies, menus, modals: white with `#222` text.
- **Text** is light-on-dark by default: primary `#F2F2F2`, secondary `#D8D8D8`, disabled `#888`.
- **Functional**: success/confirmed `#A2EBA0` (mint), warning/invited `#FFA665` (orange),
  error `#D45A5A` (muted red), info `#1982fc`. These are soft, slightly pastel — never neon.
- See `colors_and_type.css` for the full token set.

### Typography
- **One typeface: Space Grotesk** for everything. Default body weight is **medium (500)**.
- Range used: 300 (footer fine print) → 600/700 (headings, active nav).
- **Huge hero type** — the headline is `text-9xl` (~8rem) on desktop, dropping to `text-6xl`
  on mobile. Section titles are `text-2xl` semibold. Tile titles `text-3xl`. Body/taglines
  `text-lg`. Meta rows `text-xs`–`text-sm`, often `tracking-wider` and sometimes UPPERCASE
  (locations). Space Grotesk's geometric, slightly-quirky letterforms carry the brand.

### Backgrounds & imagery
- **Full-bleed photography** anchors the brand. The signature hero is a **blue duotone photo**
  of a real coworking/study space, overlaid with a hand-drawn **orange→pink gradient checkmark
  swoosh** (the opencampus motif) and darkened by layered linear gradients fading to `#0F0F0F`
  at the bottom so text stays legible. (`assets/hero-background.png`)
- Imagery vibe: **real people, candid, slightly desaturated / cool-toned**; often duotoned blue.
  Warm gradient accents (orange/pink/yellow) are layered on top.
- **Protection gradients, not scrims.** Over photos the product uses directional linear gradients
  e.g. `linear-gradient(51.32deg, rgba(0,0,0,0.7) 17.57%, rgba(0,0,0,0) 85.36%)` so the title
  (bottom-left) sits in shadow while the rest of the image breathes.
- No repeating patterns or noise textures. No purple/blue SaaS gradients.

### Shape, radius, borders
- **Pills and big rounded cards.** Buttons are fully round (`border-radius: 9999px`).
  Course tiles use `rounded-2xl` (1rem). Menus/modals `~8px`. Badges are pills.
- **Borders are structural, thin.** Buttons carry a **2px** border (secondary color) that turns
  **brand teal on hover**. Dividers/borders elsewhere are 1px in `#444` (dark) / `#D8D8D8` (light).

### Elevation & shadow
- **Shadows are restrained.** Cards rely on the light/dark contrast and rounding rather than
  heavy drop shadows. Menus use a soft `0 4px 6px rgba(0,0,0,0.1)`. Badges over photos get a
  subtle `shadow-sm`. No glow, no neumorphism.

### Cards
- A card = **rounded-2xl, photo top (≈230px) with a dark protection gradient + title overlaid
  bottom-left in white text-3xl**, then a **white (`.light`) body** with meta rows
  (day/time + language at top, tagline in the middle, location pill bottom). Tiles are a fixed
  **325×431px** in horizontal swiper rows.

### Motion
- **Subtle and functional.** Color transitions on interactive elements
  (`transition-colors`, border color → brand on hover). Menus fade in (MUI `Fade`). Horizontal
  course rows are swipe/scroll sliders (Swiper, mousewheel-to-axis). **No bounces, no parallax,
  no decorative looping animation.** Respect `prefers-reduced-motion`.

### Interaction states
- **Hover:** borders/text shift to **brand teal** `#00A398` (buttons, links, nav). Filled buttons
  shift their border to brand-light. Menu items get a light grey hover (`#E5E5E5`).
- **Active/selected:** brand teal fill (calendar), or a **left accent bar in warning-orange**
  on selected menu items (`border-left: 3px solid var(--eduhub-warning)`).
- **Disabled:** grey fill + muted zinc text; disabled label color `#888`.
- **Press:** color change only — no scale/shrink transform in the product.

### Layout rules
- Content is centered in a **`max-w-screen-xl`** (1280px) column with generous side padding
  (`px-3` mobile → `px-16` desktop).
- The **header is absolute / transparent over the hero** (`rgba(34,34,34,0.5)`), so the hero
  photo runs to the very top of the viewport.
- Hero is **full viewport height** (`h-[100vh]`), headline pinned to the bottom.
- Course rows deliberately pull **up into** the hero (`-mt-[130px]`) so tiles overlap the photo.

### Transparency & blur
- Used sparingly: the header bar and slider nav buttons use **semi-transparent dark fills**
  (`rgba(34,34,34,0.5)`) layered over photos. No backdrop-blur glass effects in the product.

---

## ICONOGRAPHY

- **Custom SVG icons, monochrome, simple line/solid style.** The product ships its own small SVG
  set under `public/images/course/` and `public/images/common/` — e.g. `pin` (location),
  `language`, `online-course`, `checkmark`, plus course-status glyphs. They're simple, single-color
  (adapt to light/dark), and used at small sizes (12–16px) inside meta rows. Copied into
  `assets/` as `icon-*.svg`.
- **The `x-calibur` arrow** (`assets/x-calibur-white.svg` / `-black.svg`) is the product's
  directional/CTA arrow glyph (white on dark, black on light).
- **No built-in icon font.** Icons are inline SVG `<img>`/`next/image`. Material UI (MUI) supplies a
  few utility icons in admin/management screens (menus, dialogs), but the public surface is custom SVG.
- **Brand logos** (`assets/`): `oc-logo.svg` — the opencampus.sh mark, a white "play/arrow"
  triangle inside an open ring (suggesting *play / start / progress*); `eduhub-logo.svg` — the
  stacked **"EDU HUB"** wordmark. In the header they sit side by side (ring mark + wordmark), white,
  over the photo.
- **Social icons** (`assets/social-*.svg`): Mastodon, LinkedIn, Instagram — the org is on the
  Fediverse (`norden.social`) first, reflecting its open/independent ethos.
- **No emoji** as UI iconography. **No unicode glyph icons** beyond a bulleted dot (`•`) used as a
  list marker.
- **Substitution note:** for any icon not present in `assets/`, use **Lucide** (https://lucide.dev)
  — matching thin, rounded, single-stroke style — and flag it as a substitution.

---

## INDEX — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — product context, content & visual rules, iconography, manifest. |
| `colors_and_type.css` | All color + type tokens as CSS custom properties (+ helper classes). |
| `SKILL.md` | Agent-Skills entry point (for use as a downloadable Claude skill). |
| `assets/` | Logos, hero/coworking imagery, course icons, social icons, favicon. |
| `preview/` | Small HTML spec cards that populate the Design System tab. |
| `ui_kits/web/` | **High-fidelity recreation of the EduHub web app** — index.html + JSX components. |
| `fonts/` | (Empty placeholder — Space Grotesk is loaded from Google Fonts; see note below.) |

### UI kits
- **`ui_kits/web/`** — the public learner-facing EduHub web app: landing page with hero + course
  rows, course detail page, login, and the account menu. See its own `README.md`.

### Font note ⚠️
**Space Grotesk** is a Google Font and ships no file in the repo, so `colors_and_type.css` loads it
from Google Fonts (`fonts.googleapis.com`). If you need self-hosted/offline files, drop the `.woff2`
into `fonts/` and replace the `@import` with an `@font-face` block. **Flag to the user if offline
licensing matters.**
