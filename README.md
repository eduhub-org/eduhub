# EduHub :mortar_board:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/edu-hub-project/application)
[![Release](https://img.shields.io/github/v/release/edu-hub-project/application)](https://github.com/edu-hub-project/application/releases)
[![Semantic Release](https://img.shields.io/badge/semantic--release-enabled-brightgreen)](https://github.com/semantic-release/semantic-release)

A comprehensive education platform focusing on course applications, event
registrations, learning communities, and the StuJo job board.

## Introduction

EduHub aims to centralize educational offerings. It enables users to apply and get accepted into courses, organize course information, manage project results, and issue certificates. It also supports micro-degrees.

**Current Focus**: Enhancing different application and registration processes, particularly for event registrations, and building stronger learning communities through a chat integration based on Mattermost.

The monorepo also hosts **StuJo** (`frontend-nx/apps/stujo`), the job board
for students in Schleswig-Holstein (stujo.net). It shares the EduHub backend
(Hasura, Keycloak, Postgres) and is white-labeled per university portal.

![EduHub Screenshot](https://github.com/edu-hub-project/application/assets/24397546/234637f5-1c99-474e-a5c7-1f6f0fc280b8)

## :rocket: Quick Start

1. Install [Docker](https://docs.docker.com/engine/install/).
2. Clone this repository.
3. **Set up environment variables** (optional for basic setup, required for Formbricks integration):
   ```bash
   cp .env.example .env
   # Edit .env and add your Formbricks credentials if needed
   ```
4. Run `docker compose up`.
5. Open the apps in your browser:
   - EduHub: `http://localhost:5000`
   - StuJo: `http://localhost:5001`
6. Log in as **admin@example.com** with password **dev**.

> **Note:** See [Development Guide](./docs/DEVELOPMENT_GUIDE.md) for detailed environment variable setup.

## :briefcase: StuJo job board

StuJo runs as a second Next.js app on port **5001** (`frontend-stujo` in
Docker Compose). Public pages include the portal landing `/`, job list
`/stellenangebote`, job detail `/stellenangebote/[id]`, and employer info
`/fuer-arbeitgeber`.

More detail: [apps/stujo/README.md](./frontend-nx/apps/stujo/README.md) and
[docs/STUJO_INTEGRATION_PLAN.md](./docs/STUJO_INTEGRATION_PLAN.md).

### White-label portals

Portals are a **branding** dimension only — all portals share one job pool.
The request hostname is resolved via `JobPortalDomain` (then
`AppSettings.domain`, then the `APP_NAME` env fallback):

| Portal | Local hostname | Staging | Production |
|--------|----------------|---------|------------|
| Root StuJo | `www.stujo.net` | `stujo-staging.opencampus.sh` | `stujo.opencampus.sh` |
| CAU | `cau.stujo.net` | `stujo-cau-staging.opencampus.sh` | `stujo-cau.opencampus.sh` |
| HAW Kiel | `haw-kiel.stujo.net` | `stujo-haw-kiel-staging.opencampus.sh` | `stujo-haw-kiel.opencampus.sh` |
| Flensburg | `flensburg.stujo.net` | `stujo-flensburg-staging.opencampus.sh` | `stujo-flensburg.opencampus.sh` |

**Local white-label preview** — map the legacy hostnames to your machine,
then open them on port 5001:

```bash
# /etc/hosts (requires sudo)
127.0.0.1  www.stujo.net cau.stujo.net haw-kiel.stujo.net flensburg.stujo.net
```

```text
http://www.stujo.net:5001          # root StuJo
http://cau.stujo.net:5001          # CAU branding
http://haw-kiel.stujo.net:5001     # HAW Kiel branding
http://flensburg.stujo.net:5001    # Flensburg branding
```

Without `/etc/hosts`, `http://localhost:5001` uses the root `stujo` portal
(`APP_NAME=stujo` in Compose). To force a different portal without host
mapping, set `APP_NAME` on `frontend-stujo` (e.g. `stujo-flensburg`) and
restart that service.

## :busts_in_silhouette: Contributing

We welcome contributions from everyone. Please check out our [Contributing Guide](./CONTRIBUTING.md) for detailed information about:

- Development workflow and branch structure
- Conventional commit guidelines
- Automated release process
- Code style and testing requirements

For technical development details, see [Development Guide](./docs/DEVELOPMENT_GUIDE.md).

## :computer: Tech Stack

- [Keycloak](https://www.keycloak.org/)
- [Hasura](https://hasura.io/)
- [Apollo](https://www.apollographql.com/)
- [React](https://reactjs.org/)
- [Tailwind](https://tailwindcss.com/)
- [Python](https://www.python.org/) & [Node.js](https://nodejs.org/en/) (Serverless Functions)

## :memo: License

This project is licensed under [AGPLv3 License](LICENSE).
