# EduHub :mortar_board:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/edu-hub-project/application)
[![Release](https://img.shields.io/github/v/release/edu-hub-project/application)](https://github.com/edu-hub-project/application/releases)
[![Semantic Release](https://img.shields.io/badge/semantic--release-enabled-brightgreen)](https://github.com/semantic-release/semantic-release)

A comprehensive education platform focusing on course applications, event registrations, learning communities, and more.

## Introduction

EduHub aims to centralize educational offerings. It enables users to apply and get accepted into courses, organize course information, manage project results, and issue certificates. It also supports micro-degrees.

**Current Focus**: Enhancing different application and registration processes, particularly for event registrations, and building stronger learning communities through a chat integration based on Mattermost.

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
5. Open `localhost:5000` in your browser.
6. Log in as **admin@example.com** with password **dev**.

> **Note:** See [Development Guide](./docs/DEVELOPMENT_GUIDE.md) for detailed environment variable setup.

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
