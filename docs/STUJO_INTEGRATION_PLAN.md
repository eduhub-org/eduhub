# StuJo → EduHub Integration Plan

Status: **validated against the stujo Rails source** (2026-07-09; supersedes the
2026-07-08 draft that was written without repo access)

StuJo (https://www.stujo.net, repo `opencampus-sh/stujo`) is a Ruby on Rails
5.2 job platform for students in Schleswig-Holstein, white-labeled per
university via subdomains (`cau.stujo.net`, `haw-kiel.stujo.net` /
`fh-kiel.stujo.net`, `flensburg.stujo.net`, plus `*.en.stujo.net` locale
variants). This document specifies how to reimplement it on the EduHub stack
(Next.js + Hasura + PostgreSQL + Keycloak + serverless functions) and how to
migrate the data. Every claim below has been verified against the Rails code
(`db/schema.rb`, `config/routes.rb`, `app/models/`, `app/controllers/`,
`lib/tasks/`) and against the EduHub migrations/metadata.

---

## 1. Scope decisions

Agreed with the product owner (2026-07-08):

1. **Jobs only.** StuJo also has *Projects* and *Activities/Veranstaltungen*
   as postable content types (near-identical field sets). These are **not
   ported**; their data is archived with the Rails DB snapshot. The new schema
   keeps the door open (posting-type dimension) if they are wanted later.
2. **e-talents is dropped.** The Rails codebase hosts a second white-label
   product, "Echte Talente" (`etalents.stujo.net` / `echtetalente.de`): a
   talent-matching platform with applicant profiles, skill ratings
   (`applicantattributes`), tags, handshakes, and TAN-based company
   invitations (`invitationtans`). It is sunset with the Rails app: static
   sunset page on its domains, no data migration, DB snapshot archived.
3. **Stripe checkout replaces pay-later invoicing.** Today employers post
   first and receive PDF invoices later (see §2.5); the new flow charges at
   publish time via Stripe. This is a deliberate business change.
4. **Evergreen (`recurring`) postings are not ported.** Rails silently
   renews flagged jobs forever, free of charge. Replacement: expiry reminder
   mail with a one-click re-post (and re-pay) link. Affected employers need
   personal communication (see §9).
5. **FEATURED** becomes an admin-set boolean on the posting, not a status.

## 2. The StuJo domain model as actually implemented

Summary of the source review; this replaces the draft's inferred model.

### 2.1 Accounts and roles
- `people` is the central identity (name, email, unique `username`,
  salutation, address, photo/CV uploads, `activation_code`). Auth is
  **custom bcrypt** (`password_hash` + `password_salt`,
  `BCrypt::Engine.hash_secret` — standard bcrypt strings), *not* Devise
  (`app/models/person.rb`).
- Roles are join tables on person: `contacts` (employer account, belongs to
  one `company`), `students` (study program, freetext, privacy flags),
  `admins`. A company can have many contacts; postings belong to a contact.
- `sitememberships.site` separates the two products (0 = StuJo,
  1 = e-talents).

### 2.2 Companies
`companies`: unique name, description, shortdescription, url, views counter,
`status`, `podcast` (2020 addition), Paperclip logo (styles small/medium/big,
`public/system/logos/:id/:style/:filename`), `address` (with geocoding for a
company map), `industry`. `associatedcompanies` models company clusters
(with a `weak` flag). Registration supports promo codes granting a free
posting credit.

### 2.3 Jobs
`jobs` (see `db/schema.rb:179`): title, description, shortdescription,
requirement, `contact_id`, `category_id`, `occupation_id` (Berufsfeld,
second filter dimension), free-form `tags`, `status` int enum (0 DELETED,
1 ARCHIVE, 2 ACTIVE, 3 FEATURED — `app/helpers/studio_helper.rb`), `payment`
(free text), `entry` (start, free text), `duration` + `duration_unit`,
`recurring`, `custom_Company` (posting on behalf of a third company),
Paperclip PDF, `region` int enum (−2 Flensburg, 0 Kiel, 1 SH+HH,
2 Deutschland, 3 Dänemark, 4 Ausland — `app/helpers/jobs_helper.rb`),
`closingdate`, `work_experience`, `working_time` (h/week), `language`,
`international` + description, views counter.

Categories (seeded lookup): Minijobs, Studentenjobs, Praktika,
Abschlussarbeiten, Festanstellungen, Trainees, Praktika für die staatliche
Anerkennung.

### 2.4 Tenancy — portals are branding, not data scoping
There is **one shared job pool**. Subdomains only select a layout
(`app/lib/layout.rb`: `stujo.html.erb`, `stujo_cau`, `stujo_fhkiel`,
`stujo_flensburg`) and the `en` subdomain switches the locale. The Flensburg
portal additionally presets the `region = −2` search filter
(`studios_controller.rb#get_region`). The job search itself
(`jobs_controller.rb#defaultsearch`) filters by status, region (with
Kiel ⊂ SH+HH semantics: `region <= param` for params 1–2), category,
occupation, company, and text — never by portal. `portalentries` scopes only
admin-managed landing-page content entries per portal.

**Restricted-visibility postings** exist via `mandates` + `memberships`
(person↔mandate) + `restrictions` (job↔mandate): a job with mandates is
visible only to members sharing one (`companies_controller.rb#isJobVisible`).
The only mandate created in code is **"HAW Kiel"**, auto-assigned when
students register via the haw-kiel portal (`students_controller.rb:83-141`) —
used for the restricted "staatliche Anerkennung" internships.

### 2.5 Payments — no PSP
Publishing is immediate; payment happens afterwards:
- On create, non-Minijob postings either consume a free credit
  (`paymentcounters`, per-type counters; legacy package tiers
  MINIJOB/STUJO250/STUJO500/PARTNER are vestigial) or create an `invoices`
  row (`jobs_controller.rb#create`).
- A nightly cron (`lib/tasks/crontasks.rake` → `AdminsController.sendInvoices`)
  groups open invoices per contact, renders a PDF with Prawn over a pdftk
  letterhead template (`app/lib/stujo/template/rechnungs_template.pdf`) and
  emails it to Campus Business Box. Payment is bank transfer within 30 days.
- Prices (net, from `Invoice#calculatePrice` and the Leistungen page):
  Festanstellungen 100 €, Studentenjobs/Praktika/Abschlussarbeiten/
  staatl.-Anerkennung 50 €, Minijobs free; +19 % VAT (= the 59.50/119 € gross
  on the live site).

### 2.6 Lifecycle & other features
- Nightly cron `Job.archiveoldjobs`: ACTIVE jobs older than **2 months** or
  past `closingdate` → ARCHIVE; `recurring` jobs get `created_at` reset
  instead (never expire). The advertised "8 weeks visibility" comes from this.
- Every job create/update mails the admins (`Notificator.checkJobMail`) —
  post-hoc moderation, no pre-approval gate.
- Students can save jobs/companies (`rememberedjobs`, `rememberedcompanies`)
  and configure a job-letter newsletter (`jobletterconfig`) — **but no cron
  task ever sends it** (only `db_backup`, `to_archive`, `invoices` exist).
- Misc: RSS feed (`jobs#feed`), `job_json`, printable PDF bulletin
  ("Aushang"), single-job PDF, company map, startups page, per-posting view
  statistics, admin impersonation, XML export, activation mails, FAQ/legal
  static pages.

## 3. Guiding principles

1. **Reuse EduHub entities where the semantics match** (users, organizations,
   invoices, mail, file storage, FAQ) instead of importing StuJo tables 1:1.
2. **Follow EduHub conventions** for everything new: PascalCase quoted table
   names, camelCase columns, serial `id` PKs, `{tableName}Id` FKs,
   `created_at`/`updated_at`, enum tables with text `value` PKs and ALL_CAPS
   values (`.claude/commands/create-migration.md`, `AGENTS.md`).
3. **One deployment, shared job pool, portals as branding** — mirroring how
   StuJo actually works (§2.4), not per-portal data scoping.
4. **Keep the StuJo design** on StuJo-facing routes while reusing EduHub
   infrastructure (auth, GraphQL hooks, mail, payments).

## 4. Reuse of existing EduHub tables

All verified against `backend/migrations/` and `backend/metadata/`.

| StuJo concept (Rails) | EduHub table | Notes |
|---|---|---|
| Employer company | `Organization` | Type `CORPORATION` (enum table `OrganizationType`). `name`, `description`, `logo`, `website`, `email`, `phone` exist; address is **split** (`addressLine1/2`, `postalCode`, `city`, `country`); invoice/billing and per-org Stripe fields already exist (`1769773700000_…_add_invoice_and_integration_fields`). `aliases` (jsonb) holds legacy slugs. |
| Employer account (`person`+`contact`) | `User` + `OrganizationAdmin` | Keycloak-backed uuid users. Add `canManageJobs` flag to `OrganizationAdmin` (pattern of `canManageCourses`/`canManageEvents`/`canManageSettings`/`canManageDegrees`; see `1780300000001_alter_OrganizationAdmin_add_canManageDegrees`). Keycloak role sync via the existing `add/remove_keycloak_org_admin_role` event triggers. |
| Student account | `User` | `organizationId` (university), `occupation`, `matriculationNumber` already exist — no student-specific table needed. |
| University portal | `Organization` (type `UNIVERSITY`) + new `JobPortal` (§5) | Branding dimension only. |
| Mandate restriction (§2.4) | `JobPosting.restrictedToOrganizationId` | Replaces mandates/memberships/restrictions: visible to all when null, else only to users with matching `User.organizationId`. Covers the single real use case (HAW Kiel). |
| Paid posting / invoice | `Invoice` + Stripe functions | `Invoice` is a lightweight reference (Stripe = system of record), `courseEnrollmentId` already nullable → add nullable `jobPostingId`. Generalize `functions/callNodeFunction/createStripeCheckout/`; extend webhook `frontend-nx/apps/edu-hub/pages/api/webhooks/stripe.ts`. |
| Transactional mails | `MailTemplate`/`MailLog` + `functions/sendMail` (Mailgun) | Port the relevant `Notificator` mails (§6, §8). |
| PDF/logo uploads (Paperclip, local disk) | GCS via `functions/shared_libs/api_clients/storage_client.py` | Single `BUCKET_NAME` env; blob layout follows the calling function's convention. |
| Per-portal branding | `AppSettings` (extended, §5) | PK `appName`; current columns: `backgroundImageURL`, `previewImageURL`, `bannerTextDe/En`, `bannerBackgroundColor`, `bannerFontColor`, `timeZone`, `showFaqSection`, `faqCollectionName`, `defaultAttendanceCertificateTemplateId`. |
| FAQ page | `Faq`/`FaqCollection`/`FaqTranslation` | One collection per portal. |
| Legal pages | existing mechanism | `docs/LEGAL_DOCUMENTS.md`. |

Hasura roles (corrected from the draft): the metadata roles are `anonymous`,
`user_access`, `instructor_access`, `org_admin_access` (suffix `_access`;
there is no bare `user` role). `admin` has implicit full access.

**Explicitly not reused:** `Course`/`CourseEnrollment`/`Program` — a job
posting is not a course. Jobs get their own small table group.

## 5. New tables (Hasura migrations + metadata)

### `JobPortal`
Branding/landing dimension — **not** job scoping (§2.4).

- `id` serial PK
- `slug` text unique (`stujo` root, `cau`, `haw-kiel`, `flensburg`)
- `organizationId` FK → `Organization` (the university, type `UNIVERSITY`)
- `appName` text FK → `AppSettings`
- `title`, `contactEmail`
- `defaultRegion` nullable FK → `JobRegion` (Flensburg presets `FLENSBURG`)
- `created_at`, `updated_at`

### `JobPosting`
- `id` serial PK, `slug` text (SEO URLs; embed legacy id for redirects)
- `organizationId` FK → `Organization` (employer)
- `contactUserId` uuid FK → `User` (the responsible org admin)
- `type` FK → **`JobPostingType`** enum table: `MINIJOB`, `WORKING_STUDENT`,
  `INTERNSHIP`, `THESIS`, `PERMANENT`, `TRAINEE`,
  `STATE_RECOGNITION_INTERNSHIP` (1:1 the Rails categories)
- `status` FK → **`JobPostingStatus`**: `DRAFT`, `PENDING_PAYMENT`,
  `PUBLISHED`, `EXPIRED`, `ARCHIVED`
- `region` FK → **`JobRegion`**: `FLENSBURG`, `KIEL`,
  `SCHLESWIG_HOLSTEIN_HAMBURG`, `GERMANY`, `DENMARK`, `ABROAD`
- `occupation` FK → **`JobOccupation`** lookup (seed from Rails
  `occupations` incl. English names)
- Field mapping from Rails: `title`, `description` (rich text),
  `shortDescription`, `requirement`, `location`, `salaryText` (← `payment`),
  `startText` (← `entry`), `durationText` (← `duration`+`duration_unit`),
  `applicationDeadline` (← `closingdate`), `workExperienceRequired` bool,
  `hoursPerWeek` (← `working_time`), `language`, `international` bool +
  `internationalDescription`, `customCompany`, `featured` bool,
  `pdfUrl` (GCS), `views` int
- `restrictedToOrganizationId` nullable FK → `Organization` (§4)
- `publishedAt`, `expiresAt`
- `legacyStujoId` integer nullable unique (ETL idempotency + redirects)
- `created_at`, `updated_at`

### `JobPostingTag`
`id`, `jobPostingId` FK, `name` text (free-form; autocomplete source).

### `JobPostingPrice`
Prices are global per type in Rails (no portal dimension):
`id`, `jobPostingType` FK unique, `price` int (cents, net: 10000/5000/0),
`currency`, `vatRate`, `durationDays` (56 = 8 weeks), `stripePriceId`.

### `JobPostingCredit`
Imported remaining free-posting credits from `paymentcounters` + future promo
grants: `id`, `organizationId` FK, `jobPostingType` nullable FK (null = any
paid type), `remaining` int. Checkout consumes a credit instead of charging
when available. Legacy package tiers are *not* ported.

### `SavedJobPosting`
Ports `rememberedjobs`: `id`, `userId` uuid FK, `jobPostingId` FK,
unique(`userId`,`jobPostingId`). (Saved *companies* are dropped — low value.)

### Dropped from the draft (contradicted by the source)
- `JobPostingPortal` m:n — no per-portal job scoping exists.
- `JobCategory`/`JobPostingCategory` — the type enum *is* the category.
- `JobApplication` — confirmed: no in-platform applications; applying happens
  via contact data in description/PDF.
- `JobAlertSubscription` — Rails has the config UI but no sender was ever
  implemented; only add if product decides to launch the feature (§9).

### Alterations to existing tables
- `OrganizationAdmin` + `canManageJobs` boolean not null default false.
- `Invoice` + `jobPostingId` integer nullable FK.
- `AppSettings` + `logoUrl`, `faviconUrl`, `primaryColor`, `secondaryColor`,
  `imprintUrl`, `privacyUrl`, `defaultLocale`, `domain` text unique nullable.
  Seed rows `stujo`, `stujo-cau`, `stujo-haw-kiel`, `stujo-flensburg`.

### Permissions (mirror `public_Organization.yaml` patterns)
- `anonymous`: select `PUBLISHED`, non-expired, unrestricted
  (`restrictedToOrganizationId: null`) postings; public Organization columns;
  portals, prices, occupations. Public job pages must work logged out (SEO).
- `user_access`: additionally restricted postings where
  `restrictedToOrganizationId` matches the user's `organizationId`; CRUD own
  `SavedJobPosting` rows.
- `org_admin_access`: CRUD `JobPosting` where
  `Organization.OrganizationAdmins: {userId: {_eq: X-Hasura-User-Id},
  canManageJobs: {_eq: true}}`; insert/update excludes `status`,
  `publishedAt`, `expiresAt`, `featured` (server-controlled).
- No explicit `admin` permissions (implicit full access).

### Cron
Add `expire_job_postings` to `backend/metadata/cron_triggers.yaml` (daily,
alongside `check_attendance` etc.): flips `PUBLISHED` past `expiresAt` →
`EXPIRED` and sends the employer a reminder mail with a re-post link.
Replaces both the Rails 2-month archiver and the `recurring` mechanism.

## 6. Payments (Stripe checkout)

Employer flow:
1. Create posting → `DRAFT` (2-step form with preview, parity with Rails).
2. Publish: `MINIJOB` → `PUBLISHED` directly. Paid type with an available
   `JobPostingCredit` → consume credit, publish. Otherwise →
   `PENDING_PAYMENT` + Stripe checkout session (generalize
   `functions/callNodeFunction/createStripeCheckout/` to accept a
   `jobPostingId` target the way it takes an enrollment today; per-org Stripe
   keys already live on `Organization`).
3. Webhook (`pages/api/webhooks/stripe.ts`, new branch): set `PUBLISHED`,
   stamp `publishedAt` / `expiresAt = now + durationDays`, create `Invoice`
   row (`jobPostingId`, Stripe references, totals).
4. Expiry cron (§5) → `EXPIRED` + re-post mail.

Stripe products/prices per `JobPostingType` (50/100 € net + 19 % VAT).
Ops change: Campus Business Box no longer receives PDF invoices by mail —
the Stripe dashboard is the system of record.

Moderation: replace `Notificator.checkJobMail` with an admin notification via
`sendMail` on create/update plus an admin review list; postings still publish
without pre-approval (parity with Rails).

Mails to port to `MailTemplate` + `sendMail`: posting published / payment
receipt (new), expiry reminder (new), admin moderation notice, employer
welcome (`newcompanymail`), account migration mail (§7).

## 7. Data migration (ETL) from the Rails MySQL database

### 7.1 Approach
One idempotent Python ETL script (repo `scripts/`, reusing
`functions/shared_libs/api_clients/`), reading a snapshot of the StuJo
**MySQL** database (the draft wrongly said Postgres/pg_dump) and writing
through Hasura/SQL into EduHub. Idempotency via `legacyStujoId` on
`JobPosting` and a legacy-id mapping for organizations/users, so it can
re-run for delta syncs before cutover.

**Scope filter first:** skip everything whose only `sitememberships.site` is
1 (e-talents; helpers `is_stujo_person?`/`is_stujo_company?` define the
semantics). Decide a retention window (§9): only migrate companies with a
posting in the last N years; others are archived, not imported.

### 7.2 Steps, in dependency order
1. **Companies → `Organization`** (type `CORPORATION`). Dedupe against
   existing EduHub organizations by normalized name + `aliases`
   (opencampus.sh itself certainly exists already). Split Rails `addresses`
   into `addressLine1`/`postalCode`/`city`/`country`. Copy Paperclip logos
   from `public/system/logos/:id/:style/:filename` (take the original/`big`
   style) to GCS via `storage_client.py`; rewrite `logo`. Store the legacy
   slug (`:id-:name.parameterize`) in `aliases`.
2. **Employer accounts → Keycloak + `User` + `OrganizationAdmin`**
   (`canManageJobs: true`). The Rails hashes are standard bcrypt and **our
   Keycloak already has the bcrypt extension** → import hashes directly via
   the Admin API (credential `algorithm: bcrypt`) so passwords keep working;
   password-reset mail only as fallback for records that fail import. Match
   by email against existing EduHub users before creating.
3. **Students:** recommended **not** to migrate accounts (value is
   employer-side; most students churn quickly) — send a "the platform moved,
   re-register here" mail instead. If saved-jobs continuity is wanted,
   migrate only students with `rememberedjobs` rows (same bcrypt import).
4. **Jobs → `JobPosting` (+ tags).** Category → `type`; status 2/3 →
   `PUBLISHED` (3 additionally `featured: true`), 1 → `ARCHIVED`, 0 → skip;
   region int → enum; `restrictions`/mandate "HAW Kiel" →
   `restrictedToOrganizationId` (HAW's Organization). `expiresAt =
   created_at + 56d`; `recurring` jobs get a fresh full window and land on a
   manual review list (§1.4). Copy Paperclip PDFs (default path under
   `public/system/jobs/pdfs/…`) to GCS, rewrite `pdfUrl`.
5. **Credits:** remaining `paymentcounters` counters → `JobPostingCredit`.
6. **Payment history: not imported.** The Rails `invoices` rows reference
   local PDF paths and don't fit the Stripe-shaped `Invoice` table. The Rails
   DB snapshot is archived read-only as the historical record.
7. **FAQ & static content:** `app/views/pages/faq.html.erb` →
   `FaqCollection` per portal; AGB/Datenschutz/Impressum via the
   legal-documents mechanism.

### 7.3 Cutover
1. Deploy alongside; full ETL; QA on a staging domain.
2. Freeze writes on Rails (maintenance banner), run delta ETL.
3. Switch DNS for `*.stujo.net` to the new frontend; e-talents domains → a
   static sunset page.
4. **301 redirects** in Next.js middleware using `legacyStujoId`/`aliases`:
   `/stellenangebote/:id(-slug)`, `/arbeitgeber/:id-:slug`,
   `*.en.stujo.net` → `/en/...` locale routes. The job/employer pages have
   SEO value and inbound links.
5. Archive the Rails DB + `public/system` snapshot; decommission after an
   agreed period.

## 8. Frontend

### 8.1 Where the code lives
The active workspace is **`eduhub/frontend-nx`** (the standalone
`~/git/frontend-nx` repo is a legacy remnant of the removed Nx monorepo —
ignore/delete it). The workspace is no longer real Nx: a plain yarn root
running `next build apps/edu-hub`, with `tsconfig.base.json` path aliases and
`Dockerfile-edu` copying the entire workspace into the builder.

**New app `apps/stujo`, sharing code with edu-hub via root-level `libs/`:**
- Extract into `libs/` (early sub-task, mechanical, no edu-hub behavior
  change): generated GraphQL types, shared queries/fragments, NextAuth/
  Keycloak config (`pages/api/auth/[...nextauth].ts`, token refresh), Apollo
  client setup, role-aware hooks (`hooks/authedQuery.ts`,
  `hooks/authedMutation.ts`).
- Sharing mechanism — **no symlinks, no CI copy step**: because builds run
  from the workspace root and Docker does `COPY . .`, a root `libs/` is
  present in dev and CI identically. Add `@shared/*` → `libs/*` to
  `tsconfig.base.json`, enable `experimental.externalDir: true` (or
  `transpilePackages`) in both apps' `next.config.js`, add root scripts
  `build:stujo`/`start:stujo`, and create `Dockerfile-stujo` as a clone of
  `Dockerfile-edu` with the stujo paths.
- EduHub deployments stay untouched; no host-resolution middleware in
  edu-hub. Portal resolution lives in `apps/stujo` only: host →
  `JobPortal.slug` → `appName` → `AppSettings` theming (CSS variables);
  `*.en.stujo.net` → next-intl `en` locale.

### 8.2 Pages
- **Public (SSR/ISR, SEO):** portal landing pages (branded hero + job list
  with the portal's `defaultRegion` preset), `/stellenangebote` with filters
  (region incl. Kiel ⊂ SH+HH semantics, type, occupation, text), job detail,
  `/arbeitgeber` directory + employer detail, `/fuer-arbeitgeber`,
  `/leistungen-und-preise`, FAQ, legal pages, RSS feed parity.
- **Employer dashboard** (client-side, `useRoleQuery`/`useRoleMutation` with
  `org_admin_access`): posting list active/archive, 2-step create with
  preview, edit, re-post expired, checkout, company profile, admin/contact
  management, per-posting view statistics.
- **Student-facing:** anonymous browsing + saved jobs for logged-in users.
- **Admin:** moderation list, company management (activation, dedupe,
  clusters), portal/AppSettings editing, credit grants.
- **Design:** port StuJo's look (colors, typography, layouts) as
  Tailwind/MUI equivalents, not pixel-perfect ERB→JSX transliteration.
  German copy uses "Du" (repo rule).
- **Dropped Rails features:** company map, PDF bulletin/"Aushang", XML
  export, admin impersonation, `landingpageentries` CMS (portal landing
  content moves into AppSettings/static content), job-letter (§9).

## 9. Open questions (business/data — the code questions are all resolved)

1. **Volume audit** on the production DB before fixing ETL scope: active
   jobs/companies/students, last-activity distribution.
2. **GDPR retention window**: how old may a dormant employer account be and
   still be migrated? (Also decides the size of the migration mail-out.)
3. **Student accounts**: confirm the recommendation not to migrate them.
4. **Job-letter**: the Rails UI exists but mails were never sent — launch it
   properly (needs `JobAlertSubscription` + cron) or drop the feature?
5. **Stripe account/ownership**: which Stripe account serves StuJo — the
   per-org fields on `Organization` or a dedicated platform account?
6. **`recurring` employers**: list affected companies (evergreen jobs) and
   agree the pricing communication before cutover.
7. **e-talents sunset**: notice period and communication to its users.

## 10. Phasing

| Phase | Content | Depends on |
|---|---|---|
| 0 | ✅ Source validation (this document) | — |
| 1 | Migrations + metadata for §5, permissions, cron trigger, seed data; regenerate types | 0 |
| 2 | ETL script (MySQL source) + Keycloak bcrypt import + GCS file copy; staged full import | 1 |
| 3 | `libs/` extraction; `apps/stujo`: public pages, employer dashboard, admin views | 1 |
| 4 | Stripe products/prices, generalized checkout + webhook, expiry cron function, mail templates | 1, 3 |
| 5 | Redirect middleware, delta sync, DNS cutover, Rails + e-talents decommission | 2–4 |

Phases 2, 3, 4 are parallelizable after phase 1.
