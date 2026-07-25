# EduHub :mortar_board:

[![Release](https://img.shields.io/github/v/release/eduhub-org/eduhub)](https://github.com/eduhub-org/eduhub/releases)
[![Semantic Release](https://img.shields.io/badge/semantic--release-enabled-brightgreen)](https://github.com/semantic-release/semantic-release)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPLv3-blue)](LICENSE)

An education platform for course applications, event registrations, learning
communities, student projects, and certificates — the software behind
[edu.opencampus.sh](https://edu.opencampus.sh).

![EduHub Screenshot](https://github.com/edu-hub-project/application/assets/24397546/234637f5-1c99-474e-a5c7-1f6f0fc280b8)

## Introduction

EduHub centralizes educational offerings: learners discover courses and events,
apply or register, work on projects, and receive certificates. Organizations
manage programs, courses, sessions, experts, and enrollments from a single admin
area.

## :sparkles: What's inside

- **Courses & applications** — catalog, application/enrollment flows with
  admission decisions, sessions, attendance, and course content pages
- **Events & registrations** — event registrations with confirmation and
  reminder emails
- **Projects** — proposal → publication workflow with documentation templates
  ([manual](./docs/PROJECTS_USER_MANUAL.md))
- **Certificates & degrees** — achievement and attendance certificates from
  configurable HTML templates ([manual](./docs/CERTIFICATES_USER_MANUAL.md))
- **Payments** — Stripe checkout for paid courses and job postings
  ([docs](./docs/STRIPE_INTEGRATION.md))
- **Surveys** — Formbricks integration for questionnaires and pricing add-ons
  ([docs](./docs/FORMBRICKS_INTEGRATION.md))
- **Chat** — Matrix/Element spaces and rooms created per program and course
- **Automated emails** — registration mails and session reminders
  ([setup](./docs/EMAIL_SYSTEM_SETUP.md))
- **Distribution** — embeddable widgets (courses, projects, jobs) and a
  [MOOCHub](./docs/MOOCHUB_FEED_DOCUMENTATION.md) feed
- **Multi-portal & i18n** — host-based portal resolution with per-portal
  branding, German/English UI

## :rocket: Quick Start

1. Install [Docker](https://docs.docker.com/engine/install/).
2. Clone this repository.
3. Create your local env file (optional for a basic setup; required for
   Stripe/Formbricks/Matrix/Ghost integrations):
   ```bash
   cp .env.example .env
   # fill in only the integrations you need — see comments in .env.example
   ```
4. Run `docker compose up` (first start builds images and applies migrations
   and seeds; give it a few minutes).
5. Open `http://localhost:5000` and log in as **admin@example.com** /
   **dev**.

Local services:

| Service | URL | Notes |
| --- | --- | --- |
| EduHub frontend | http://localhost:5000 | Next.js dev server, hot reload |
| StuJo frontend | http://localhost:5001 | job board portal, same backend |
| Hasura | http://localhost:8080 | GraphQL endpoint at `/v1/graphql`, admin secret `myadminsecretkey` |
| Keycloak | http://localhost:28080 | admin console, `admin` / `admin` |
| File storage emulator | http://localhost:4001 | serves `/emulated-bucket` |
| Serverless functions | ports `42000`–`42026` | Node `42000`–`42024`, Python `42025`–`42026` |

> **Note:** See the [Development Guide](./docs/DEVELOPMENT_GUIDE.md) for
> environment variables, seeds, ports, and naming conventions.

## :hammer_and_wrench: Repository layout

| Path | Contents |
| --- | --- |
| `frontend-nx/` | Yarn-workspace monorepo of Next.js apps: `apps/edu-hub` (main app), `apps/stujo` (job board) |
| `backend/` | Hasura metadata, SQL migrations, and seeds |
| `functions/` | Node and Python serverless functions ([guide](./docs/SERVERLESS_FUNCTIONS.md)) |
| `keycloak/` | Keycloak realm imports, themes, and custom listeners |
| `infrastructure/` | Terraform for the Google Cloud staging/production environments |
| `docs/` | Feature documentation, user manuals, and ADRs (`docs/adr/`) |
| `.github/workflows/` | CI: code checks, image builds, releases, infrastructure deploys |

## :computer: Tech Stack

- **Frontend** — [Next.js](https://nextjs.org/) 16 (Pages Router) with
  [React](https://react.dev/) 19, TypeScript,
  [Tailwind](https://tailwindcss.com/), [MUI](https://mui.com/),
  [Apollo Client](https://www.apollographql.com/), and
  [next-intl](https://next-intl.dev/)
- **API & data** — [Hasura](https://hasura.io/) GraphQL over PostgreSQL
- **Auth** — [Keycloak](https://www.keycloak.org/) with
  [NextAuth.js](https://next-auth.js.org/); roles `admin`, `instructor`,
  `user`, `anonymous`
- **Serverless** — [Node.js](https://nodejs.org/) and
  [Python](https://www.python.org/) functions (Google Cloud Functions in
  staging/production)
- **Infrastructure** — Terraform, Google Cloud Run, GitHub Actions,
  [semantic-release](https://github.com/semantic-release/semantic-release)

## :busts_in_silhouette: Contributing

We welcome contributions from everyone. Please read the
[Contributing Guide](./CONTRIBUTING.md) for:

- Branch structure (`develop` → `staging` → `production`) and release flow
- [Conventional Commits](https://www.conventionalcommits.org/) guidelines
- Pull request and automated release process
- Code style and testing requirements

Frontend commands (from `frontend-nx/`, Node 20 and Yarn 3.4.1):

```bash
yarn install
yarn lint          # ESLint, matches CI
yarn test          # Jest + React Testing Library
yarn type-check    # tsc --noEmit
yarn apollo        # regenerate GraphQL types after query/schema changes
```

Schema changes must be applied as Hasura migrations in `backend/migrations/`
with matching metadata — see the [Development Guide](./docs/DEVELOPMENT_GUIDE.md).

## :memo: License

This project is licensed under the [AGPLv3 License](LICENSE).
