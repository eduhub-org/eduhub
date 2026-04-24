---
name: start-dev
description: Start and inspect the EduHub local development environment. Use when bringing up the Docker stack, checking service URLs and ports, tailing logs, or resetting the local dev environment.
---
# Start Dev

Use this skill for local environment bring-up and service inspection.

## Main Command

From the repo root:

```bash
docker compose up -d
```

## Key Services

- frontend: `http://localhost:5000`
- Hasura: `http://localhost:8080`
- Keycloak: `http://localhost:28080`

Login:

```text
admin@example.com / dev
```

## Useful Variants

```bash
docker compose up frontend-nx hasura
docker compose logs -f frontend-nx
docker compose down
docker compose down -v
docker compose up --build
```

## Expected Startup Notes

- Keycloak and Hasura may take 30-60 seconds on first boot
- the frontend container may spend extra time installing dependencies before the app is ready

## When To Use Host Commands Instead

Lint, tests, and builds run on the host from `frontend-nx/`, not inside the Docker containers:

- `yarn lint`
- `yarn test`
- `yarn build`

## Output Style For This Skill

When helping the user start the app, mention:

1. the command used
2. the primary service URLs
3. any startup delay or known wait time that matters
