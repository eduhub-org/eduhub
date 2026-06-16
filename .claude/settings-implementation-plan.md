# Settings Reorganization — Implementation Plan

Anchored on the recommended **A + C hybrid**: an accordion-grouped Settings
landing page (low migration cost, familiar) with email templates promoted to
their own routed sub-page (the category that will grow most). Phases 1–2 and
4–7 are largely design-independent; Phase 3 is the only part that changes if
you pick pure-A (sidebar) or pure-C (single page) instead.

> Scope note: items marked **[BE]** need backend / Hasura work. Everything else
> is frontend-only.

---

## Current state (as built today)

| Thing | Location |
|---|---|
| Settings page | `pages/manage/app-settings/index.tsx` → `components/pages/ManageAppSettingsContent/index.tsx` (442-line monolith, 7 stacked sections) |
| Already-split sub-components | `CourseGroupOptionsManager.tsx`, `ProjectDocumentationInstructionsSection.tsx` |
| Email templates page | `pages/manage/email-templates/index.tsx` → `ManageEmailTemplatesContent` (reusable; also rendered per-course) |
| Menu | `components/layout/Menu.tsx` — two separate admin entries: "Email templates" + "App settings" |
| Auth | `hooks/authentication.ts` — only `useIsAdmin/useIsInstructor`; whole page gated on `isAdmin` |
| i18n | `locales/{en,de}.json` — namespaces `manageAppSettings`, `manageEmailTemplates`, `common.menu` |
| Email trigger types (live) | APPLICATION_RECEIVED, APPLICATION_CONFIRMED, INVITE, DECLINE, REGISTRATION_CONFIRMED(_PAID), APPLICATION_RECEIVED_PAID, SESSION_REMINDER, USER_CREATED, ORGANIZER_ADDED |

---

## Target information architecture

```text
Settings  (route: /manage/settings — renamed from "App settings")
├─ Appearance
│   └─ Banner (colors, text DE/EN)
├─ Homepage content
│   ├─ Course groups (visibility, order)
│   └─ FAQ section (visibility, collection)
├─ Email notifications        → /manage/settings/emails  (own sub-page)
│   ├─ Application process     (INVITE, DECLINE, *_CONFIRMED, *_RECEIVED…)
│   ├─ Project notifications   (soon — placeholder)
│   ├─ Session reminders       (SESSION_REMINDER; expand later)
│   └─ System emails           (USER_CREATED, ORGANIZER_ADDED)
├─ Program defaults
│   ├─ Default certificate templates (per program type)
│   ├─ Project documentation guides
│   └─ Onboarding texts (DE/EN, per program type)
├─ System
│   └─ Time zone
└─ Access & roles  🔒          (super-admin only — scaffold now, enforce later [BE])
```

---

## Phase 1 — Settings registry (single source of truth)

Create `components/pages/ManageSettings/config.ts` exporting a typed array that
drives nav, accordion headers, and access checks alike:

```ts
type SettingsSection = {
  id: string;                 // 'banner', 'emails', 'timezone'…
  group: SettingsGroup;       // 'appearance' | 'homepage' | 'emails' | 'programDefaults' | 'system' | 'access'
  labelKey: string;           // i18n key in `manageSettings`
  descriptionKey: string;
  icon: ReactNode;            // Lucide / existing SVG
  route?: string;             // set only for sections that get their own page (emails)
  status: 'live' | 'soon';
  requiredCapability: Capability; // see Phase 5; defaults to 'admin'
};
```

This config is what makes the three designs interchangeable and future sections
a one-line addition.

## Phase 2 — Decompose the monolith (design-independent, low risk)

Split the 7 inline blocks of `ManageAppSettingsContent` into self-contained
section components under `components/pages/ManageSettings/sections/`:

- `BannerSettingsSection` (extract the react-hook-form banner form)
- `TimeZoneSection`
- `FaqSettingsSection`
- `DefaultCertificateTemplatesSection`
- `OnboardingTextsSection` (incl. the live preview — lazy-load it)
- reuse existing `CourseGroupOptionsManager`, `ProjectDocumentationInstructionsSection`

Each owns its own query/mutation wiring (currently all hoisted into the parent).
Land this first — it's a pure refactor, fully shippable on its own, and de-risks
everything after.

## Phase 3 — Page shell & routing (the only design-dependent phase)

**Recommended hybrid:**
- New route `/manage/settings/index.tsx` → renders accordion groups from the
  Phase 1 config (reuse MUI `Accordion`, already a dependency — no new dep).
- New route `/manage/settings/emails.tsx` → email category sub-page.
- Keep `/manage/app-settings` and `/manage/email-templates` as **redirects**
  (Next.js `redirects()` in `next.config.js`) so existing bookmarks survive.

If you instead choose:
- **Pure A (sidebar):** add `SettingsLayout` (persistent left rail from config) +
  nested routes `/manage/settings/[section]`. More files, best deep-linking.
- **Pure C (single page):** drop the `emails.tsx` route; render everything inline
  with the email list expanding in-place. Fewest files.

## Phase 4 — Email templates: categorization

- Add a `category` derivation for template `type` (map the live trigger types to
  Application / Session / System; Project = future).
- In `ManageEmailTemplatesContent`, add a category tab/section layer **above** the
  existing `TableGrid`, gated behind a new `grouped?: boolean` prop so the
  per-course usage of this component is unaffected (no regression).
- Add "coming soon" placeholders for Project notifications and expanded Session
  reminders, matching the mockup treatment.

## Phase 5 — Role-based access scaffolding

Granular per-person access is the biggest unknown and splits into two layers:

- **Frontend scaffold (now):** add `useCanAccessSetting(sectionId)` reading the
  config's `requiredCapability` against the current role. For today it returns
  `true` for admins; locked sections render greyed with a padlock + role chip
  (exactly as in the mockups). Purely visual — no security boundary yet.
- **Real enforcement (later) [BE]:** introduce a capability/permission model —
  new Hasura roles or JWT claims (e.g. `settings:emails`, `settings:appearance`)
  and Hasura row/column permissions. This is a separate, larger workstream;
  the frontend scaffold is designed to slot onto it without rework.

## Phase 6 — Menu, naming & i18n

- `Menu.tsx`: rename "App settings" → **Settings** → `/manage/settings`; remove the
  standalone "Email templates" entry (now a section inside Settings).
- i18n: add `common.menu.settings`; introduce a `manageSettings` namespace and
  migrate/group the existing `manageAppSettings` + relevant `manageEmailTemplates`
  strings. Update **both `en.json` and `de.json`** (German-first parity).
- Update page `<title>` / `Head`.

## Phase 7 — Verify & ship

- `/regenerate-types` only if any GraphQL doc changes (none expected unless the
  Phase 5 backend work lands in the same PR).
- `/run-tests` (Jest + RTL) — add tests for config-driven rendering and the
  access-gating hook.
- `/lint-project`.
- Manual: responsive layout, `.light` scoping on cards/modals, keyboard nav for
  accordion/sidebar, `prefers-reduced-motion`, redirects resolve.

---

## Suggested PR sequence

1. **PR 1 — Refactor** (Phase 2): split monolith into section components. No UX
   change, fully shippable, de-risks the rest.
2. **PR 2 — Shell + rename** (Phases 1, 3, 6): config registry, new
   `/manage/settings` accordion page, redirects, menu rename, i18n.
3. **PR 3 — Email categories** (Phase 4): sub-page + category tabs + soon
   placeholders.
4. **PR 4 — Access scaffold** (Phase 5 frontend only): lock UI + hook.
5. **PR 5 [BE] — Real permissions** (Phase 5 backend): separate, when prioritized.

## Key risks / call-outs

- **`ManageEmailTemplatesContent` is shared** with per-course pages — all changes
  must be prop-gated (`grouped?`) to avoid regressing the course view.
- **Granular access needs backend design** — frontend can show locks now, but
  enforcement is a Hasura/JWT effort. Don't ship the scaffold as if it were a
  security boundary.
- **Onboarding preview is heavy** — lazy-load it when behind a route/accordion.
- **Backward compatibility** — keep redirects from the two old routes.
