---
name: start-dev
description: Start EduHub development environment with Docker. Use when the user asks to start dev server, run locally, start development, or set up the environment.
---
# Start Development Environment

## Quick Start

```bash
# From project root
docker compose up
```

This starts all services:
- **Frontend**: http://localhost:5000 (edu-hub)
- **Hasura Console**: http://localhost:8080
- **Keycloak**: http://localhost:28080

## Individual Services

```bash
# Start specific services
docker compose up frontend-nx hasura

# Start in background
docker compose up -d

# View logs for specific service
docker compose logs -f frontend-nx
```

## Service Overview

| Service | Port | Description |
|---------|------|-------------|
| frontend-nx | 5000 | Next.js app |
| hasura | 8080 | GraphQL API |
| keycloak | 28080 | Authentication |
| db_hasura | 5432 | PostgreSQL |
| node_functions | 42000-42024 | Serverless functions |
| python_functions | 42025-42026 | Python functions |

## Common Tasks

### Rebuild containers
```bash
docker compose up --build
```

### Reset database
```bash
docker compose down -v
docker compose up
```

### Stop all services
```bash
docker compose down
```

## Hasura Console

Run locally for migrations (not in Docker):
```bash
cd backend
hasura console --admin-secret myadminsecretkey
```
