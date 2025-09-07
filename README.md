# EduHub :mortar_board:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/edu-hub-project/application)
[![Release](https://img.shields.io/github/v/release/edu-hub-project/application)](https://github.com/edu-hub-project/application/releases)
[![Semantic Release](https://img.shields.io/badge/semantic--release-enabled-brightgreen)](https://github.com/semantic-release/semantic-release)

A comprehensive education platform focusing on course applications, event registrations, learning communities, and more.

## Introduction

EduHub aims to centralize educational offerings. It enables users to apply and get accepted into courses, organize course information, manage project results, and issue certificates. It also supports micro-degrees.

**Current Focus**: Enhancing different application and registration processes, particularly for event registrations, and building stronger learning communities through a chat integration based on Mattermost.

![EduHub Screenshot](https://github.com/edu-hub-project/application/assets/24397546/234637f5-1c99-474e-a5c7-1f6f0fc280b8)

## :file_folder: Project Structure

EduHub follows a **monorepo structure** using pnpm workspaces:

```
eduhub/
├── frontend-nx/           # Next.js applications (Nx workspace)
│   ├── apps/
│   │   ├── edu-hub/      # Main education platform
│   │   └── rent-a-scientist/ # Secondary app
│   └── libs/             # Shared frontend libraries
├── functions/            # Serverless functions (Google Cloud)
│   ├── callNodeFunction/ # Node.js functions
│   ├── callPythonFunction/ # Python functions
│   └── apiProxy/         # API gateway functions
├── backend/              # Hasura GraphQL + PostgreSQL
├── keycloak/             # Authentication service
└── infrastructure/       # Terraform IaC
```

### Package Management Strategy
- **Frontend**: pnpm workspace for optimal performance and disk space
- **Functions**: Individual npm packages for Google Cloud Functions compatibility
- **Root**: pnpm workspace coordinator

## :rocket: Quick Start

1. **Install Dependencies**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | sh
   
   # Install pnpm
   corepack enable pnpm
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/edu-hub-project/application.git
   cd application
   pnpm install
   ```

3. **Start Development Environment**
   ```bash
   docker compose up
   ```

4. **Access Application**
   - Frontend: http://localhost:5000
   - Login: **admin@example.com** / **dev**
   - Hasura Console: http://localhost:8080
   - Keycloak Admin: http://localhost:28080 (admin/admin)

## :busts_in_silhouette: Contributing

We welcome contributions from everyone. Please check out our [Contributing Guide](./CONTRIBUTING.md) for detailed information about:

- Development workflow and branch structure
- Conventional commit guidelines
- Automated release process
- Code style and testing requirements

For technical development details, see [Development Guide](./docs/DEVELOPMENT_GUIDE.md).

## :computer: Tech Stack

### Core Technologies
- **Frontend**: [Next.js](https://nextjs.org/) + [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Material-UI](https://mui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Apollo GraphQL Client](https://www.apollographql.com/)
- **Backend**: [Hasura GraphQL](https://hasura.io/) + [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [Keycloak](https://www.keycloak.org/) + [NextAuth.js](https://next-auth.js.org/)
- **Functions**: [Python](https://www.python.org/) & [Node.js](https://nodejs.org/en/) (Google Cloud Functions)
- **Build System**: [Nx](https://nx.dev/) + [pnpm](https://pnpm.io/) workspaces

### Development Tools
- **Package Manager**: pnpm (frontend) + npm (functions)
- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Testing**: Jest + React Testing Library + Playwright
- **CI/CD**: GitHub Actions + Semantic Release
- **Deployment**: Docker + Google Cloud Platform

## :memo: License

This project is licensed under [AGPLv3 License](LICENSE).
