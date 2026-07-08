# StuJo → EduHub Integration Plan

Status: proposal (2026-07-08)

StuJo (https://www.stujo.net, repo `opencampus-sh/stujo`) is a Ruby on
Rails job platform for students in Schleswig-Holstein. It is white-labeled
per university via subdomains (`cau.stujo.net`, `fh-kiel.stujo.net`,
`flensburg.stujo.net`, plus `*.en.stujo.net` locale variants). Employers
create company profiles and pay to publish job postings (side jobs,
internships, thesis positions, trainee and permanent positions; roughly
60 € gross for 8 weeks, 119 € for permanent positions). Job postings can
carry PDF attachments (Paperclip-style file paths).

This document proposes how to translate StuJo to the EduHub stack
(Next.js + Hasura + PostgreSQL + Keycloak + serverless functions), with a
focus on the **data migration strategy**: what to reuse from the existing
EduHub database and what to add.

> **Caveat — validate against the Rails code.** The StuJo source could not
> be read while writing this plan (private repo outside this session's
> GitHub scope). The domain model below is inferred from the live
> platform. Before implementation, verify against `db/schema.rb`,
> `config/routes.rb`, and `app/models/` in the stujo repo. Open questions
> are collected in [§8](#8-open-questions-to-verify-in-the-stujo-code).

---

## 1. Guiding principles

1. **Reuse EduHub entities where the semantics match** (users, companies,
   payments, mail, file storage) instead of importing StuJo's tables 1:1.
2. **Add job-board tables following EduHub conventions**: PascalCase
   quoted table names, camelCase columns, `id` serial PKs,
   `{tableName}Id` FKs, `created_at`/`updated_at`, ALL_CAPS enum tables
   (see `AGENTS.md` and `.claude/commands/create-migration.md`).
3. **One deployment, many portals.** StuJo already shares companies and
   jobs across its university subdomains, so it should become a single
   EduHub-style deployment with a portal/tenant dimension — not one
   deployment per university.
4. **Keep the StuJo design** on the StuJo-facing routes while reusing
   EduHub's infrastructure (auth, GraphQL hooks, mail, payments).

## 2. Reuse of existing EduHub tables

| StuJo concept (Rails) | EduHub table | Notes |
|---|---|---|
| Employer / company | `Organization` | Type `CORPORATION` (enum already exists). `name`, `description`, `logo`, `website`, `email`, `phone`, address and invoice columns already cover the employer profile. `aliases` can hold legacy slugs. |
| Employer account (Devise user) | `User` + `OrganizationAdmin` | Keycloak-backed uuid users. Add a `canManageJobs` capability flag to `OrganizationAdmin` (same pattern as `canManageCourses` / `canManageEvents` / `canManageSettings` / `canManageDegrees`). |
| Student account (if any) | `User` | Students already exist in EduHub; `matriculationNumber`, `organizationId` (university), `occupation` are present. |
| University tenant | `Organization` (type `UNIVERSITY`) + new `JobPortal` | See §3. |
| Paid posting / invoice | `Invoice` + Stripe functions | `Invoice` is a lightweight reference table with Stripe as system of record. Add a nullable `jobPostingId` FK alongside the existing nullable `courseEnrollmentId`. Reuse `createStripeCheckout` (generalize) and the Stripe webhook route. |
| Transactional mails | `MailTemplate` / `MailLog` + `sendMail` function | Port StuJo's ActionMailer templates. |
| PDF/logo uploads (Paperclip) | Google Cloud Storage via `functions/shared_libs/api_clients/storage_client.py` | Same bucket layout conventions as existing upload functions. |
| Per-site branding | `AppSettings` (extended) | Already keyed by `appName` (PK); the frontend currently hardcodes `appName: 'edu'`. See §5. |
| FAQ pages | `Faq` / `FaqCollection` / `FaqTranslation` | StuJo's FAQ becomes a collection per portal. |

**Explicitly not reused:** `Course`/`CourseEnrollment`/`Program` — a job
posting is not a course; forcing it in would pollute enrollment,
attendance, and certificate logic. Jobs get their own small table group.

## 3. New tables (Hasura migrations + metadata)

All following EduHub conventions; enum tables seeded like
`OrganizationType`.

### `JobPortal`
The tenant dimension (one row per university site, e.g. `cau`,
`fh-kiel`, `flensburg`).

- `id` serial PK
- `slug` text unique (subdomain / path key)
- `organizationId` FK → `Organization` (the university, type
  `UNIVERSITY`)
- `appName` text FK → `AppSettings` (branding, see §5)
- `title`, `contactEmail`
- `created_at`, `updated_at`

### `JobPosting`
- `id` serial PK, `slug` text (SEO URLs, keep legacy id in slug for
  redirects)
- `organizationId` FK → `Organization` (the employer)
- `type` text FK → `JobPostingType` enum table: `WORKING_STUDENT`,
  `INTERNSHIP`, `THESIS`, `TRAINEE`, `PERMANENT` (verify exact set
  against Rails model)
- `status` text FK → `JobPostingStatus` enum table: `DRAFT`,
  `PENDING_PAYMENT`, `PUBLISHED`, `EXPIRED`, `ARCHIVED`
- `title`, `description` (rich text), `location`, `remoteAllowed`,
  `hoursPerWeek`, `salaryText`, `startDate`, `applicationDeadline`
- `applicationEmail`, `applicationUrl`
- `pdfUrl` (GCS)
- `publishedAt`, `expiresAt` (drives the 8-week window; a cron trigger —
  Hasura `cron_triggers.yaml` — flips `PUBLISHED` → `EXPIRED`)
- `legacyStujoId` integer nullable unique (ETL idempotency + redirects)
- `created_at`, `updated_at`

### `JobPostingPortal` (m:n)
Jobs appear on several university sites (observable on the live
platform: the same `companyid` shows up on `cau.*` and `fh-kiel.*`).

- `id`, `jobPostingId` FK, `jobPortalId` FK, unique(jobPostingId,
  jobPortalId)

### `JobPostingPrice`
- `id`, `jobPortalId` nullable FK (null = global default),
  `jobPostingType` FK, `price` integer (cents), `currency`,
  `durationDays`, `stripePriceId`

### Optional (verify in Rails schema first)
- `JobCategory` + `JobPostingCategory` — only if StuJo has categories
  beyond the posting type.
- `JobApplication` — only if applications happen in-platform rather than
  via `applicationEmail`/`applicationUrl`.
- `JobAlertSubscription` — only if StuJo offers saved-search email
  alerts.

### Hasura permissions (per `security-auth` conventions)
- `anonymous`: select `PUBLISHED`, non-expired postings, public
  organization columns, portals, prices. Public job pages must work
  logged-out (SEO).
- `user`: same as anonymous plus own applications (if applications
  exist).
- `org_admin_access`-style role: employers CRUD `JobPosting` rows where
  an `OrganizationAdmin` row with `canManageJobs` links them to the
  posting's `organizationId` (mirror the existing org-admin filter
  pattern in `public_Organization.yaml`).
- No explicit `admin` permissions (admin is implicit).

## 4. Data migration (ETL) from the Rails database

### 4.1 Approach

One idempotent ETL script (Python, living in `functions/` tooling or
`scripts/`), reading a snapshot of the StuJo Postgres (`pg_dump`) and
writing through Hasura/SQL into EduHub. Idempotency via
`legacyStujoId` columns (and a `legacyStujoCompanyId` on imported
`Organization` rows or a small `LegacyStujoMapping` side table), so the
script can re-run for delta syncs before cutover.

### 4.2 Steps, in dependency order

1. **Companies → `Organization`.** Dedupe against existing EduHub
   organizations by normalized name and `aliases` (opencampus.sh itself
   is an employer on StuJo and certainly already exists in EduHub).
   Store the legacy slug (`/arbeitgeber/:id-:slug`) in `aliases`.
   Copy logos to GCS, rewrite `logo`.
2. **Employer accounts → Keycloak + `User` + `OrganizationAdmin`.**
   Devise stores bcrypt hashes. Two options:
   - *Preferred UX:* import bcrypt hashes into Keycloak via a bcrypt
     credential-hash provider extension so passwords keep working.
   - *Simpler:* create accounts with required password-reset action and
     send a migration email via `sendMail`.
   Match by email against existing EduHub users before creating.
   Create `OrganizationAdmin` rows with `canManageJobs: true`.
3. **Student accounts** (if they exist in StuJo): same email-matching
   strategy; most students likely overlap with existing EduHub users.
4. **Job postings → `JobPosting` + `JobPostingPortal`.** Map Rails
   states to the new status enum; compute `expiresAt` from the paid
   period. Copy Paperclip PDFs
   (`/system/jobs/pdfs/000/012/315/original/…`) into the GCS bucket and
   rewrite `pdfUrl`.
5. **Payment history → `Invoice`.** Import past invoices as read-only
   rows (terminal status, `notes: 'imported from StuJo'`, no Stripe
   references). If the volume or quality is poor, keep the Rails DB
   archived read-only instead and skip this step — decide with the
   team.
6. **FAQs and static content** → `FaqCollection` per portal; legal pages
   into the existing legal-documents mechanism (`docs/LEGAL_DOCUMENTS.md`).

### 4.3 Cutover

1. Deploy the new stack alongside; run full ETL; QA on a staging domain.
2. Freeze writes on the Rails app (maintenance banner), run delta ETL.
3. Switch DNS for `*.stujo.net` to the Next.js frontend.
4. Serve **301 redirects** for legacy URLs (`/stellenangebote/:id`,
   `/arbeitgeber/:id-:slug`, `*.en.stujo.net` → locale route) via
   Next.js middleware using `legacyStujoId`/`aliases` — the job pages
   have SEO value and inbound links.
5. Keep the Rails DB snapshot archived; decommission after an agreed
   period.

## 5. White-label strategy (StuJo keeps it, EduHub gains it)

`AppSettings` is already a per-app branding table keyed by `appName`
(banner, background, FAQ collection, time zone) — but the frontend pins
`appName: 'edu'` (`contexts/AppSettingsContext.tsx`). Proposal:

1. **Resolve the tenant from the request host** in Next.js middleware:
   `cau.stujo.net` → `appName: 'stujo-cau'`, `edu.opencampus.sh` →
   `'edu'`. Fall back to the `APP_NAME` env var so existing single-brand
   EduHub deployments behave exactly as today.
2. **Extend `AppSettings`** with the columns StuJo's branding needs:
   `domain` (unique), `logoUrl`, `faviconUrl`, `primaryColor`,
   `secondaryColor`, `fontFamily`, `imprintUrl`, `privacyUrl`,
   `defaultLocale`. `ManageAppSettingsContent` grows into a per-tenant
   theming editor.
3. **Theme injection**: map these values onto CSS variables / the MUI
   theme at layout level, so both the StuJo routes and the EduHub routes
   are themable from the database.
4. Content scoping stays per-domain: job queries filter by the resolved
   portal; EduHub course content is unaffected until (if ever) courses
   get a tenant dimension. This keeps the change low-risk for EduHub:
   step 1+2 alone already turn EduHub's theming DB-driven per
   deployment, and full multi-domain hosting is an opt-in follow-up.

## 6. Frontend translation (keep the StuJo design)

- **Where the code lives**: `frontend-nx` is an Nx workspace. Two
  options:
  - *(a) Separate Nx app* `apps/stujo` sharing libs (Apollo config,
    auth hooks, common inputs) — cleanest way to keep StuJo's own look
    and navigation without leaking EduHub chrome. **Recommended.**
  - *(b) Route group inside `edu-hub`* with a tenant-conditional layout —
    less duplication, but every layout/theming decision needs a tenant
    switch.
- **Design**: port StuJo's stylesheets/assets (colors, typography, page
  layouts for home, `/stellenangebote`, job detail, employer profile,
  `/fuer-arbeitgeber`, `/leistungen-und-preise`, FAQ) into the new app;
  Tailwind/MUI equivalents rather than pixel-perfect ERB→JSX
  transliteration.
- **Rendering**: public job pages via SSR/ISR (SEO matters for a job
  board); employer dashboard client-side with `useRoleQuery` /
  `useRoleMutation`.
- **i18n**: `next-intl` `de`/`en` replaces the `*.en.stujo.net`
  subdomains (redirects per §4.3; German copy uses "Du" per repo rule).
- **Auth**: NextAuth/Keycloak replaces Devise; "employer" is not a new
  Keycloak role but a `user` with an `OrganizationAdmin.canManageJobs`
  row (matches the existing org-admin model).
- **Mails, payments**: `sendMail` function + Stripe checkout functions
  (generalized from course enrollment to job postings; webhook flips
  `PENDING_PAYMENT` → `PUBLISHED` and stamps `publishedAt`/`expiresAt`).

## 7. Phasing

| Phase | Content | Depends on |
|---|---|---|
| 0 | Access to stujo repo; validate §8 against `schema.rb`/`routes.rb`; freeze the target domain model | — |
| 1 | Migrations + metadata for §3, `canManageJobs`, `Invoice.jobPostingId`, `AppSettings` extension; permissions; regenerate types | 0 |
| 2 | ETL script + Keycloak import + GCS file copy; staged full import | 1 |
| 3 | Frontend: public portal pages (design port), employer dashboard, admin management | 1 |
| 4 | Stripe products/prices, checkout + webhook, expiry cron, mails | 1, 3 |
| 5 | Redirect middleware, delta sync, DNS cutover, Rails decommission | 2–4 |

## 8. Open questions (to verify in the stujo code)

1. Exact tables/columns in `db/schema.rb` — especially posting fields,
   states, and anything not visible from the public site.
2. Do students have accounts? Are there in-platform applications
   (`JobApplication`) or only email/URL applications?
3. Are there job categories/tags beyond the posting type? Saved-search
   email alerts?
4. How is tenancy implemented (subdomain column, `apartment` gem, or
   separate sites)? Which portals exist beyond `cau`, `fh-kiel`,
   `flensburg`?
5. Payment provider in Rails (Stripe already? invoices by hand?) — this
   decides whether existing Stripe customers can be carried over.
6. Attachment storage (Paperclip local disk vs S3) — determines the file
   copy mechanism.
7. Anything admin-only: moderation/approval flow for postings, coupon
   codes, statistics dashboards.

## Session note

This plan was authored without read access to `opencampus-sh/stujo`
(private repo outside the session's GitHub scope; cross-org `add_repo`
is not supported). To close Phase 0, start a Claude session with the
stujo repo as a source (or mirror it into `eduhub-org`) and check the
inferred model against the actual schema.
