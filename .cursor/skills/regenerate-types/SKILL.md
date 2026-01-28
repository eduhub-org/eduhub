---
name: regenerate-types
description: Regenerate TypeScript types from GraphQL schema using Apollo codegen. Use when the user asks to update types, regenerate types, run codegen, or after GraphQL schema changes.
---
# Regenerate GraphQL Types

## Prerequisites

- Backend (Hasura) must be running
- Run `docker-compose up hasura` if not already running

## Quick Command

```bash
# From frontend-nx directory
cd frontend-nx

# Regenerate types for edu-hub
yarn nx run edu-hub:apollo

# Regenerate types for rent-a-scientist
yarn nx run rent-a-scientist:apollo
```

## What This Does

1. Clears existing generated types in `queries/__generated__/`
2. Runs Apollo codegen against all `queries/**/*.ts` files
3. Generates TypeScript types matching GraphQL operations

## When to Run

Run codegen after:
- Adding new GraphQL queries or mutations
- Modifying existing queries
- Backend schema changes (new tables, columns, relationships)
- Pulling changes that include query modifications

## Troubleshooting

### "Cannot reach GraphQL endpoint"
Ensure Hasura is running:
```bash
docker-compose up hasura
```

### Types not updating
Clear and regenerate:
```bash
rm -rf apps/edu-hub/queries/__generated__/*
yarn nx run edu-hub:apollo
```

### Schema introspection fails
Check Hasura is healthy:
```bash
curl http://localhost:8080/healthz
```

## Generated Files Location

- edu-hub: `apps/edu-hub/queries/__generated__/`
- rent-a-scientist: `apps/rent-a-scientist/queries/__generated__/`
