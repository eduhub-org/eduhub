# EduHub Web — UI Kit

A high-fidelity, interactive recreation of the **public, learner-facing EduHub web app**
(`edu.opencampus.sh`). It is a cosmetic recreation for prototyping — not production code —
built by reading the real Next.js source in `eduhub-org/eduhub`
(`frontend-nx/apps/edu-hub/`).

## Run it
Open `index.html`. It's a React + Babel single page; assets and tokens are pulled from the
design-system root (`../../assets`, `../../colors_and_type.css`).

## What it demonstrates (click-through)
- **Landing** — full-bleed hero (`Start Hacking / Your Life`) over the duotone brand photo,
  with horizontally-scrolling **course tile** rows grouped by track (Tech, Business, Creative).
- **Login / Register** — modal in the product's `.light` style. Logging in swaps the header
  Login/Register buttons for the **avatar + account menu** (Profile / My Certificates / … / Logout).
- **Course detail** — click any tile: hero with course title, tagline + **application panel**,
  "What you'll learn" checklist, numbered **sessions**, and a details info panel.
- **Apply flow** — "Apply now" prompts login if needed, then confirms with a toast and flips the
  panel to an enrolled state.
- **EN | DE** language toggle, account menu with the warning-orange selected accent bar.

## Files
| File | Role |
|---|---|
| `index.html` | App shell + state (routing, auth, enrollment, toasts). |
| `styles.css` | Kit styles (consumes tokens from `../../colors_and_type.css`). |
| `data.js` | Fake course data in EduHub copy style (`window.EH_DATA`). |
| `Components.jsx` | `Button`, `Avatar`, `Header`, `AccountMenu`, `Footer`, `LoginModal`. |
| `Landing.jsx` | `CourseTile`, `CourseRow`, `Landing`. |
| `CourseDetail.jsx` | `CourseDetail`, `Registration`, `InfoPanel`. |

## Fidelity notes
- Buttons, tiles, menu, header and the dark/`.light` surface flips mirror the real components
  (`common/Button.tsx`, `TileSlider/TileBase.tsx`, `layout/{Header,Footer,Menu}.tsx`).
- All course covers reuse the one brand photo shipped in the repo, varied by crop. Swap in real
  course imagery for production.
- Auth (Keycloak), GraphQL data (Hasura/Apollo), payments and the large admin/management surface
  are intentionally **omitted** — this kit covers the public learner journey only.
