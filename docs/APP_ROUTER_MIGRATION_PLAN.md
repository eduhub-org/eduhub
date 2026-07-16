# EduHub App Router Migration Plan

Stepwise migration of the `edu-hub` Next.js app in three stages:

1. **Stage A** — Upgrade React 18.3 → React 19.2 (stay on Next.js 15.5, Pages Router)
2. **Stage B** — Upgrade Next.js 15.5 → Next.js 16.2 (stay on Pages Router)
3. **Stage C** — Migrate from the Pages Router to the App Router

Each stage is independently shippable through the normal
`develop` → `staging` → `production` flow, with a soak period on staging
before promoting. There are no database or backend changes anywhere in this
plan; every stage is revertable with a plain `git revert`.

---

## 1. Current state (assessed 2026-07)

| Aspect | State |
|--------|-------|
| Workspace | Yarn 3.4.1 workspace `frontend-nx/` with two Next.js apps sharing ONE `package.json`: `apps/edu-hub` (main) and `apps/stujo` |
| Next.js | `^15.5.18`, Pages Router, `output: 'standalone'`, built-in `i18n` config (`de` default, `en`) |
| React | `18.3.1` (+ `@types/react` 18.3.5) |
| Routing surface | ~45 pages in `apps/edu-hub/pages/`, 7 API routes under `pages/api/` |
| Data fetching | Client-side only via Apollo (`config/apollo.ts`); **no SSR data fetching**. Only 3 pages export `getServerSideProps`: `course/[courseId]` (`withAuthRedirect` for `?force_login`), `manage/admin-users`, `manage/programs` (both return empty props, i.e. only used to force dynamic rendering) |
| Auth | `next-auth` v4 (Keycloak provider) + client-side token store (`AuthStoreUpdater`, `config/authStore.ts`); API routes for refresh + logout |
| i18n | `next-intl` v4 in **Pages Router mode**: `NextIntlClientProvider` in `_app.tsx` with full `locales/{de,en}.json` (~2 700 lines each) bundled client-side; locale comes from Next's built-in i18n routing (`router.locale`); 151 files use `useTranslations` |
| MUI | v6 + `@mui/material-nextjs` v7 with the `v15-pagesRouter` Emotion cache adapter in `_app`/`_document` |
| `next/router` | Imported in 28 files; `router.events` used in `_app.tsx` (FB pixel pageviews); shallow routing in `pages/index.tsx` and `hooks/useWidgetLocale.ts` |
| `next/head` | Used in 23 pages (SEO meta, mostly on `index.tsx`) |
| Special routes | `/widget/*` pages are embedded in third-party iframes and get permissive CSP/CORS headers via `next.config.js` `headers()`; locale is passed by query param (`useWidgetLocale`) |
| Middleware | None |
| Styling | Tailwind 3 + Emotion/MUI; Google Fonts `<link>` (Space Grotesk) in `_document` |
| Scripts | Cookiebot (`beforeInteractive`, `_document`), FB pixel + Plausible (`afterInteractive`, `_app`) |
| Tests | Jest 29 + RTL 16 (a handful of unit tests); `cypress`/`playwright` are in devDependencies but no specs live in the repo |
| CI | `.github/workflows/frontend-code-checks.yml`, Node 20, `yarn build` + `yarn lint` |
| Docker | `frontend-nx/Dockerfile-edu` builds on **`node:18-alpine`** and copies the `standalone` output |
| Babel | `frontend-nx/babel.config.json` (only `babelrcRoots`, used by Jest via `babel-jest`); no custom webpack config in `next.config.js` |

Two structural facts make this migration much cheaper than usual:

- **The app is effectively a client-rendered SPA.** Pages are thin shells
  around `components/pages/*Content` components. There is almost no
  server-side data fetching to redesign — App Router pages can be thin
  server shells that render existing client components.
- **Pages Router and App Router can coexist** in one app, so routes can be
  moved in reviewable batches. The one real coupling point is i18n routing
  (see §5.2).

Version targets (verified current as of July 2026):

- React **19.2.x** (latest 19.2.7)
- Next.js **16.2.x** (latest 16.2.10, current LTS line)

---

## 2. Stage A — React 19 (Pages Router, Next 15.5)

> **Status: implemented** (same PR as this plan). Deltas found during
> implementation: `react-select`, `swr`, and the `@radix-ui/*` packages
> also needed bumps (React-19 peer warnings); `@mui/lab` had to be pinned
> exactly to `6.0.0-beta.32` (a caret range resolves to a `dev` prerelease
> that is peer-locked to React 18); the unused `@mui/styles` package was
> removed; `apps/stujo` needed its own `.eslintrc.json` to build.

Next.js 15.5 supports React 19 on the Pages Router, so this lands
independently of the Next upgrade.

### A.1 Core bumps

```
react            18.3.1  → ^19.2.x
react-dom        18.3.1  → ^19.2.x
@types/react     18.3.5  → ^19.x
@types/react-dom 18.3.0  → ^19.x
```

Run the official types codemod first — it fixes most `@types/react` 19
breakage mechanically (implicit-children, `React.FC` props, ref types):

```bash
npx types-react-codemod@latest preset-19 apps/edu-hub apps/stujo
```

### A.2 React 19 breaking changes to check in this codebase

- **`defaultProps` on function components is removed** — grep and inline
  default parameters instead.
- **`element.ref` / string refs / legacy context** — grep; unlikely present.
- **`useRef` now requires an argument** in the new types; `ref` cleanup
  functions change some callback-ref typings.
- **Stricter `ReactNode`/JSX namespace types** — expect a wave of small
  type errors; fix with the codemod plus manual cleanup, `yarn type-check`
  is the gate.
- ~~`pages/_app.tsx` calls `setDefaultLocale(locale)` (react-datepicker)
  **during render**~~ — **done**: moved into a `useEffect` as part of this
  stage (render-phase side effects are riskier under React 19 concurrent
  rendering).

### A.3 Dependency compatibility audit

Libraries that must be bumped because their current majors don't declare
React 19 peer support (verify exact versions during implementation with
`yarn install` peer warnings + smoke test):

| Package | Current | Action for React 19 |
|---------|---------|---------------------|
| `next-auth` | `^4.24.7` | Bump to latest v4 (`4.24.11+` adds React 19 peer). **Stay on v4** — Auth.js v5 is a separate project, out of scope. |
| `@apollo/client` | `~3.11.5` | Bump to latest 3.x (React 19 peer support landed in 3.12). Staying on 3.x avoids the Apollo Client 4 migration. |
| `@mui/material` / `icons` / `lab` / `x-date-pickers` | 6.0.x / lab beta | Bump to latest 6.x line (React 19 support added mid-6.x). **Stay on MUI 6 for this stage** to contain scope. ⚠️ Known exception: MUI 6 is past end-of-support (the current line is v9; only the two newest majors receive security fixes). A dedicated MUI major upgrade (6 → 7 → current, following each migration guide + codemods) must be scheduled as its own workstream, at the latest right after Stage C — it is deliberately NOT bundled into the React/Next/router migration because each MUI major carries its own breaking-change surface. |
| `@hello-pangea/dnd` | `^16.6.0` | v17+ required for React 19. |
| `recharts` | `^2.12.7` | ≥2.15 required for React 19. |
| `react-datepicker` | `^7.3.0` | v8 required for React 19 (check `OptimisticDatePicker` and holiday logic after bump). |
| `@headlessui/react` | `^2.1.3` | ≥2.2 required for React 19. |
| `react-debounce-input` | `^3.3.0` | Unmaintained, peer-locked to ≤React 18. **Replace** its few usages with `use-debounce` (already a dependency) and drop the package. |
| `@testing-library/react` | `16.1.0` | Already React 19-compatible; just align `@types/react` peers. |

Expected to be unaffected (framework-agnostic or already compatible; verify
via install + smoke test): `keycloak-js`, `@fullcalendar/*` 6, `@tiptap/*` 2,
`swiper` 12, `@radix-ui/*`, `react-hook-form` 7, `react-select` 5,
`react-markdown` 9, `react-icons`, `lucide-react`, `@tanstack/react-table` 8.

Delete `@types/react-icons` and `@types/react-select` (both packages ship
their own types; the stubs will fight the new JSX types).

### A.4 Verification gate for Stage A

- `yarn type-check` + `yarn type-check:stujo` clean
- `yarn test` green; `yarn lint` green
- `yarn build` + `yarn build:stujo` succeed
- Manual staging pass of the core flows (see §7 checklist)
- No `useLayoutEffect`/hydration warnings in the browser console on the
  home page, course page, and one manage page

**Estimated effort: 2–4 dev days** (dominated by the type-error sweep and
the datepicker/dnd bumps).

---

## 3. Stage B — Next.js 16.2 (still Pages Router)

Next 16 fully supports the Pages Router (including the built-in `i18n`
config), so this is a contained upgrade.

### B.1 Runtime prerequisites — do these first

- **Node ≥ 20.9 is required.** `frontend-nx/Dockerfile-edu` and
  `Dockerfile-stujo` still build on `node:18-alpine` → move to
  `node:22-alpine` (LTS). CI is already on Node 20; consider bumping the
  root `engines` field from `>=20 <21` to `>=20.9 <23` at the same time.
- TypeScript 5.7 ✓ (Next 16 needs ≥5.1).

### B.2 The upgrade

```bash
npx @next/codemod@latest upgrade   # bumps next + applies codemods
```

plus `eslint-config-next` → 16.x.

Relevant Next 16 breaking changes checked against this codebase:

| Change | Impact here |
|--------|-------------|
| **Turbopack is the default** for `next dev` and `next build` | No custom webpack config ✓. The root `frontend-nx/babel.config.json` (only `babelrcRoots`, present for Jest) is a project-wide Babel config that Next may detect. In Next 16, Turbopack **auto-enables a built-in babel-loader when a Babel config is detected** (`turbopackUseBuiltinBabel`, default `true`); SWC still performs Next's internal transforms either way, so this is a build-perf question, not a correctness blocker. During the upgrade: check the build log for Babel activation; if active, measure build impact and either set `turbopackUseBuiltinBabel: false` or scope the Babel config to Jest (`transform` in `jest.config.ts`) — decide from the measured result. Escape hatch: `next build --webpack`. |
| `next lint` removed | Not used — repo calls `eslint` directly ✓. `eslint-config-next@16` may push toward ESLint 9 flat config; if it does, either pin ESLint 8 compat or convert `.eslintrc.json` → `eslint.config.mjs` (`@eslint/compat` is already installed). |
| `images.domains` removed | Already on `remotePatterns` ✓ |
| AMP support removed | Not used ✓ |
| `middleware.ts` renamed `proxy.ts` | No middleware today; Stage C will create `proxy.ts` directly ✓ |
| Async request APIs (`params`, `searchParams`, `cookies()`) | App Router-only — becomes relevant in Stage C |
| Caching defaults / Cache Components | Opt-in; irrelevant for a client-rendered SPA |

### B.3 Deployment-pipeline checks

- `output: 'standalone'` layout: confirm the paths copied in
  `Dockerfile-edu` (`.next/standalone`, `.next/static`, `public/`) are
  unchanged under 16 and that `node server.js` still boots. Also check
  whether the `jest-worker` copy hack in the Dockerfile is still needed.
- Verify `next.config.js` `redirects()`/`headers()` (widget CSP/CORS!)
  still behave identically.
- Compare bundle sizes and build times before/after (Turbopack should
  improve both; record numbers in the PR).

### B.4 Verification gate for Stage B

Same checklist as Stage A, plus: Docker image builds and runs locally
(`docker compose up`), widget iframe headers verified with `curl -I`,
locale-prefixed URLs (`/en/...`) still resolve.

**Estimated effort: 1–3 dev days** (mostly Turbopack/pipeline validation).

---

## 4. Stage C — App Router migration

### 4.1 Strategy

Big-bang rewrites are how migrations die; but a months-long coexistence has
its own trap here: **the Pages Router's built-in `i18n` config and App
Router locale routing interact badly** (the `i18n` config is ignored by
`app/` routes, so `/en/<migrated-route>` would 404 while the route lives in
`app/` unless the `[locale]` segment + proxy are already in place).

Therefore: migrate in batches, but keep the coexistence window **short and
structured** — one PR for the foundation, then 4–5 route-batch PRs landed
over 1–2 weeks, then a cleanup PR. Do not let the app sit half-migrated
across releases.

Route batches (each one PR, each independently testable on staging):

1. **Foundation** (no user-visible change yet): `app/` scaffold, providers,
   `proxy.ts`, fonts, `not-found`, plus the static pages as pilot —
   `imprint`, `privacy`, `terms`, `help`, `404`
2. **Public/core**: `index`, `auth/signin`, `course/[courseId]` (+
   `payment-success`, `payment-cancelled`, `project/[id]`), `project/[id]`,
   `profile`, `my-certificates`, `statistics`
3. **Manage (part 1)**: `manage/courses`, `manage/course/[courseId]` (+
   email-templates), `manage/users`, `manage/admin-users`
4. **Manage (part 2)**: remaining `manage/*` incl. the ~16
   `manage/settings/*` pages (they share `SettingsLayout` — becomes a real
   App Router `layout.tsx`, a genuine win)
5. **Widgets**: `widget/courses`, `widget/projects`, `widget/test`
6. **Cleanup**: delete `pages/*.tsx`, `_app`, `_document`, remove `i18n`
   from `next.config.js`, final sweeps

`pages/api/*` stays put during all of this (fully supported), see §4.7.

### 4.2 i18n routing — the structural core of the migration

The App Router does not support `next.config.js` `i18n`. Replacement:
next-intl's App Router mode (already on next-intl v4, which supports it
natively).

Target setup that **preserves every existing URL**:

- `apps/edu-hub/i18n/routing.ts`:
  `defineRouting({ locales: ['en','de'], defaultLocale: 'de', localePrefix: 'as-needed' })`
  — `de` stays unprefixed, `/en/...` stays prefixed, `NEXT_LOCALE` cookie
  keeps working (same cookie the built-in i18n uses today).
- `apps/edu-hub/proxy.ts` (Next 16's middleware): next-intl's
  `createMiddleware(routing)` (imported from `next-intl/middleware` — the
  Next 16 change is only the *filename*, `middleware.ts` → `proxy.ts`; the
  next-intl API keeps its name) with a matcher that **excludes** `/api`,
  `/_next`, static files, and `/widget` (widgets negotiate locale via query
  param, and iframe embeds must never be redirected).
- Route tree: `app/[locale]/…` for everything except widgets;
  `app/[locale]/layout.tsx` calls `setRequestLocale`, loads messages via
  next-intl's `getMessages`, and renders the provider stack.
- Locale-aware navigation: `createNavigation(routing)` exports `Link`,
  `useRouter`, `usePathname`, `redirect` — use these everywhere instead of
  `next/link`/`next/navigation` directly so locale prefixes stay automatic
  (mechanical sweep; ~30 files import `next/router` or `next/link`).
- Localized 404: `app/[locale]/[...rest]/page.tsx` calling `notFound()` +
  `app/[locale]/not-found.tsx` (port of `pages/404.tsx`).

**Coexistence rule:** the `i18n` key stays in `next.config.js` until the
last page leaves `pages/` (it only affects `pages/` routes); the proxy
matcher must therefore also exclude any route still living in `pages/`
during batches 1–5. Keep an explicit matcher list per batch — this is the
single most error-prone piece of the migration; test `/en/<route>` and
`/<route>` for both migrated and unmigrated routes after every batch.

Follow-up win (post-migration): stop shipping both full 2 700-line message
files to the client — `NextIntlClientProvider` can receive per-request,
per-namespace messages picked server-side.

### 4.3 Root layout and provider stack (replaces `_app.tsx` + `_document.tsx`)

```
app/
  [locale]/
    layout.tsx        ← server: html/body, fonts, metadata, NextIntlClientProvider
    providers.tsx     ← 'use client': SessionProvider → ApolloProvider →
                         AppRouterCacheProvider → ThemeProvider →
                         AuthErrorProvider → AppSettingsProvider →
                         AuthStoreUpdater + analytics
    not-found.tsx
    [...rest]/page.tsx
  widget/
    layout.tsx        ← minimal providers, no header/footer chrome
    courses/page.tsx …
```

Mapping of everything `_app`/`_document` do today:

| Today | App Router home |
|-------|-----------------|
| MUI `AppCacheProvider` (`v15-pagesRouter`) + `DocumentHeadTags` | `AppRouterCacheProvider` from `@mui/material-nextjs/v16-appRouter` (single component, no `_document` part needed) |
| Google Fonts `<link>` (Space Grotesk) | `next/font/google` in root layout (removes a render-blocking request; set `--font-body` var for Tailwind) |
| Cookiebot `<Script strategy="beforeInteractive">` | Same `next/script` in root layout |
| FB pixel + Plausible `afterInteractive` scripts | `providers.tsx` (client) |
| FB pixel pageview on `router.events.routeChangeComplete` | `router.events` doesn't exist in App Router → dedicated client component with a `useEffect` on `usePathname()`/`useSearchParams()`. **Must preserve all existing guards**: fire only after the pixel script's `onLoad` has set the loaded flag AND `typeof window.fbq === 'function'`, keep the effect cleanup, and keep the Cookiebot consent gating (`type="text/plain"` + `data-cookieconsent="marketing"`) so no tracking runs before marketing consent. |
| `<body className="font-body text-edu-black bg-edu-bg-gray">` | Root layout `<body>` |
| `globals.css` / `widget.css` imports | Root layout (importing in both routers during coexistence is fine — each router bundles separately) |
| `pageProps.session` for `SessionProvider` | Omit (v4's provider fetches the session client-side; this app never SSRs the session) |
| react-datepicker `registerLocale`/`setDefaultLocale` | `providers.tsx`, inside `useEffect` |
| loglevel setup | module scope of a client util, unchanged |

### 4.4 Per-page migration pattern

Pages are already thin shells → each becomes:

```tsx
// app/[locale]/course/[courseId]/page.tsx  (server component)
import CourseContent from '../../../../components/pages/CourseContent';

export async function generateMetadata({ params }) { … }   // from old <Head>
export default function CoursePage() {
  return <CourseContent />;   // existing component, gets 'use client'
}
```

- Add `'use client'` at the top of each `components/pages/*Content` entry
  file (and layout components like `Page`, `Header`, `Footer`). Deeper
  components inherit it — do **not** blanket-annotate every file.
- `next/head` (23 pages) → `export const metadata` / `generateMetadata` in
  the server `page.tsx`. The big SEO block in `pages/index.tsx` (OG,
  Twitter, canonical, theme-color) maps 1:1 to the Metadata API; the
  JSON-LD `<script>` stays as rendered JSX. This *improves* SEO for `en`
  since `generateMetadata` gets the locale and can localize + emit
  `alternates.languages` (hreflang), which doesn't exist today.
- Route params: `useRouter().query` → `useParams()` / `useSearchParams()`
  in client components (server pages: `await params` — async in Next 16).

### 4.5 `next/router` → `next/navigation` sweep (28 files)

| Pages Router idiom | App Router replacement |
|--------------------|------------------------|
| `useRouter().push/replace(string)` | Same, but import from `i18n/navigation` (next-intl) for locale awareness |
| `router.query.foo` | `useParams()` (path params) or `useSearchParams().get('foo')` |
| `router.locale` (`_app`, `ProfileContent`, widgets) | `useLocale()` from next-intl (already used in most places) |
| `router.events` (`_app` FB pixel) | `usePathname` effect (§4.3) |
| `router.isReady` | Gone — search params are always ready; delete the guards |
| Shallow routing (`pages/index.tsx` sessionExpired-param strip, `useWidgetLocale`) | `window.history.replaceState` (officially supported for this in App Router), or `router.replace(..., { scroll: false })` where a re-render is fine |
| `withAuthRedirect` / `getServerSideProps` (`course/[courseId]`) | Server component: `getServerSession(authOptions)` + `redirect()` for the `?force_login` case |
| `getServerSideProps: () => ({ props: {} })` (2 manage pages, only forces dynamic rendering) | Delete — client-heavy App Router pages are dynamic; add `export const dynamic = 'force-dynamic'` only if a prerender problem actually shows up |

### 4.6 Widgets (highest regression risk after i18n)

- Live outside `[locale]` (`app/widget/*`) with their own minimal
  `layout.tsx`; excluded from the proxy matcher so iframes are never
  redirected.
- `useWidgetLocale` (currently does a shallow locale switch via
  `next/router`) → read `?locale=` and pass it straight into a local
  `NextIntlClientProvider` — simpler than today.
- Keep `next.config.js` `headers()` for `/widget/:path*` untouched; verify
  with `curl -I` and a real cross-origin iframe embed on staging.

### 4.7 API routes (`pages/api/*`)

Keep them in place during the migration — zero risk, fully supported by
Next 16. Optional follow-up PR after cleanup, converting to route handlers:

- `auth/[...nextauth].ts` → `app/api/auth/[...nextauth]/route.ts`
  (documented next-auth v4 pattern, ~10 lines)
- `webhooks/stripe.ts` uses `raw-body` + `bodyParser: false` → route
  handler `await req.text()` (drop the `raw-body` dep). **Test signature
  verification against Stripe test webhooks explicitly.**
- Others (`keycloakRefreshToken`, `logout`, `certificates/download`,
  `ghost-newsletter-credential`, `widget/validate-api-key`) are
  mechanical conversions.

### 4.8 Cleanup batch

- Delete `pages/` (except `api/`), `_app.tsx`, `_document.tsx`
- Remove `i18n` from `next.config.js`; drop the pages-only proxy-matcher
  exclusions
- Remove `@mui/material-nextjs` pagesRouter imports, `AppCacheProvider`
- Grep gates: no `next/router`, no `next/head`, no `getServerSideProps`,
  no `next/document` outside `pages/api`
- Update `AGENTS.md`, `docs/DEVELOPMENT_GUIDE.md`, and the
  `frontend-patterns` skill docs to describe the App Router layout

**Estimated effort for Stage C: 2–3 dev weeks** (foundation + i18n ≈ 1
week; route batches are mechanical but need per-batch staging QA).

---

## 5. The stujo app

`apps/stujo` shares the workspace `package.json`, so **Stages A and B apply
to it automatically** — it must build and be smoke-tested on React 19 +
Next 16 as part of those PRs (`yarn build:stujo`, `yarn type-check:stujo`).
Its own App Router migration (~10 pages, same next-auth setup) is **out of
scope** here; it stays on the Pages Router, which is exactly why Stage C
keeps `pages/api` patterns and shared helpers backward-compatible. Schedule
it as a fast-follow using this document as the template.

---

## 6. Risks and mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Locale-routing conflicts while `pages/` i18n config and `app/[locale]` coexist | **High** | Short coexistence window; explicit proxy matcher per batch; test matrix `{de,en} × {migrated,unmigrated}` after every batch (§4.2) |
| Widget iframes break (redirects, headers, locale) | **High** | Widgets excluded from proxy; headers untouched; real-embed test on staging before each promote (§4.6) |
| Turbopack build differences (Babel detection, standalone output) | Medium | Verify in Stage B before any router work; `--webpack` escape hatch |
| React 19 peer-dep breakage in long-tail libs | Medium | Stage A audit list (§A.3); `yarn install` peer warnings treated as errors; staging soak |
| Auth/token refresh regressions (`AuthStoreUpdater`, session polling) | Medium | Untouched API routes until final follow-up; explicit QA of login → 5-min token refresh → logout on every stage |
| Stripe webhook raw-body handling | Medium | Don't convert until the optional follow-up; then test with Stripe CLI test events |
| SEO regressions (meta parity, hreflang, prerendered locale pages) | Medium | Metadata API port reviewed page-by-page against old `<Head>`; compare rendered HTML `<head>` before/after for `/` and `/course/[id]` |
| Shallow-routing behavior changes | Low | Only 2 call sites; use `history.replaceState` pattern |
| Bundle-size regression from double message bundles / provider stack | Low | Record `next build` size table per batch |

---

## 7. Verification checklist (run on staging at every stage/batch)

- Login (Keycloak), session refresh after token expiry, logout
- Home page sliders (anonymous + logged-in + instructor)
- Course detail → registration/enrollment flow → `?force_login` redirect
- Stripe payment success/cancelled redirect pages
- Certificates download (API route)
- Manage: courses table, course detail tabs, one settings page + sidebar nav
- Locale: `/` (de), `/en`, deep links `/en/course/<id>`, `NEXT_LOCALE`
  cookie persistence, no wrong-language flash
- Widgets embedded cross-origin: `/widget/courses?locale=en`, headers via
  `curl -I`
- Redirects from `next.config.js` (`/impressum`, `/manage/app-settings`, …)
- FB pixel + Plausible fire on client-side navigation; Cookiebot consent
  gating still blocks them before consent
- SEO: `view-source` head parity on `/` (de + en)
- `yarn test`, `yarn lint`, `yarn type-check`, both app builds, Docker
  image boots

---

## 8. Suggested PR sequence

| # | PR | Stage |
|---|-----|-------|
| 1 | chore: Node 22 Docker images, engines, CI alignment | prep |
| 2 | feat: React 19 + dependency compatibility bumps | A |
| 3 | feat: Next.js 16.2 upgrade (Turbopack validation, eslint-config) | B |
| 4 | feat: App Router foundation — [locale] layout, providers, proxy, static pages | C-1 |
| 5 | feat: migrate public/core routes | C-2 |
| 6 | feat: migrate manage routes (part 1) | C-3 |
| 7 | feat: migrate manage/settings routes (part 2) | C-4 |
| 8 | feat: migrate widget routes | C-5 |
| 9 | chore: remove Pages Router remnants, docs update | C-6 |
| 10 | (optional) refactor: API routes → route handlers; per-namespace intl messages | follow-up |

Total estimate: **4–6 dev weeks** elapsed, front-loaded on validation
rather than code volume. Stages A and B are low-risk and can ship in the
first week; Stage C's foundation PR is where the careful review belongs.
