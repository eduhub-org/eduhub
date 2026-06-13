---
name: eduhub-design
description: Use this skill to generate well-branded interfaces and assets for EduHub by opencampus.sh, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Key files:
- `README.md` — product context, content & visual rules, iconography, full manifest.
- `colors_and_type.css` — all color + type tokens as CSS custom properties (plus helper classes).
- `assets/` — real logos (opencampus ring mark + EduHub wordmark), hero/coworking imagery,
  monochrome course icons, social icons, favicon.
- `preview/` — small spec cards showing colors, type, components and brand at a glance.
- `ui_kits/web/` — a high-fidelity, interactive React recreation of the EduHub web app; lift
  components (course tiles, header, buttons, course detail) from here.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and
create static HTML files for the user to view. If working on production code, copy assets and
read the rules here to become an expert in designing with this brand.

Core brand reminders: single typeface **Space Grotesk** (medium weight default); **dark**
charcoal surfaces (`#222`/`#0F0F0F`) with content cards flipping to **white** (`.light`); one
accent — **teal-green `#00A398`**; **pill** buttons with a 2px border that turns teal on hover;
**rounded-2xl** photo cards with a diagonal protection gradient; full-bleed duotone photography;
restrained motion; **no emoji** in the UI. Voice is direct, energetic and learner-focused
("Start Hacking Your Life"), bilingual EN/DE.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_
production code, depending on the need.
