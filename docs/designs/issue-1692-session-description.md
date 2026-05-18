# Issue #1692 — Session description display (design proposals)

**GitHub:** [eduhub-org/eduhub#1692](https://github.com/eduhub-org/eduhub/issues/1692)

## Goal

Show the optional per-session `description` where it helps participants and staff, without cluttering sessions that have no description.

## Current state

| Surface | Description shown? |
|---------|-------------------|
| Manage course → Sessions tab (edit) | Yes — textarea, max **500** chars, plain text |
| Calendar popover | Yes — below speakers, bordered section |
| **Course page → Termine list** (`Sessions.tsx`) | **No** — field is in GraphQL but not rendered |

Sessions without a description stay unchanged (empty string in DB).

## Technical constraints (recommended for implementation)

| Topic | Recommendation |
|-------|----------------|
| Max length | **500 characters** (already enforced in admin `InputField`) |
| Formatting | **Plain text** only — preserve line breaks (`whitespace-pre-wrap`), no markdown |
| Visibility | Only render when `description.trim().length > 0` |
| Permissions | Field already exposed via `SessionFragment` for course viewers |

## Design options (course page session list)

All options use the existing two-column layout: **date/time left**, **title + location + speakers right**.

### Option A — Inline subtitle *(minimal)*

Description appears directly under the session title, same column as location/speakers.

```
15. Mai 2026          Workshop: Prototyping
18:00 - 20:00         Bitte Laptop und Sketch-Dateien mitbringen.
                      ONLINE
                      [Speaker card]
```

- **Style:** `text-sm text-label-secondary` (or existing `text-gray-400` for location parity)
- **Pros:** Simplest; consistent with calendar popover; no extra chrome
- **Cons:** Long descriptions (up to 500 chars) make the list tall

---

### Option B — Truncated with expand *(balanced)*

Show at most **2 lines** (`line-clamp-2`). If text overflows, show **„Mehr anzeigen“ / „Weniger anzeigen“** per session (local state).

- **Pros:** Keeps list scannable; full text still available
- **Cons:** Slightly more UI logic; users must click to read long notes

---

### Option C — Info callout *(emphasized)*

Description in a subtle container: left **brand** border, `bg-bg-secondary`, padding, optional label **„Hinweis“**.

- **Pros:** Clearly “extra” optional info; stands out for prep/materials notes
- **Cons:** Heavier visual weight; may feel loud if many sessions have descriptions

---

### Option D — Collapsed by default *(compact)*

When description exists, show a text button **„Details anzeigen“** (chevron). Expands inline to full text; **„Details ausblenden“** to collapse.

- **Pros:** Zero clutter when collapsed; good for courses with few annotated sessions
- **Cons:** Easy to miss; extra click for important info

---

## Visual mockup

See `issue-1692-session-description-designs.png` in this folder and open `issue-1692-session-description-preview.html` in a browser for an interactive side-by-side preview.

## Other surfaces (follow-up, same release or later)

1. **Calendar** — already implemented in `SessionDetailPopover.tsx`; align styling with chosen option where sensible.
2. **Emails / reminders** — scan `functions/` if description should appear in templates (product decision).

## How to choose

Reply with **A**, **B**, **C**, or **D** (or a hybrid, e.g. “B but without the Hinweis label from C”). Implementation will apply only to the course session list unless you specify otherwise.
