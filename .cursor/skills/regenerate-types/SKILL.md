---
name: regenerate-types
description: Regenerate TypeScript types from GraphQL schema using Apollo codegen. Use when the user asks to update types, regenerate types, run codegen, after GraphQL schema changes, after database migrations, or after modifying Hasura metadata.
---
# Regenerate GraphQL Types

## Prerequisites

- Hasura must be running and accessible at `http://localhost:8080/v1/graphql`
- Start with: `docker-compose up hasura` (from project root)

## Quick Command

Run from the `frontend-nx` directory with the GraphQL URI:

```bash
cd /home/steffen/git/eduhub/frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn nx run edu-hub:apollo 2>&1 | tail -50
```

For rent-a-scientist:

```bash
cd /home/steffen/git/eduhub/frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn nx run rent-a-scientist:apollo 2>&1 | tail -50
```

## When to Run

Run codegen after:
- Adding new GraphQL queries or mutations
- Modifying existing queries
- Backend schema changes (new tables, columns, relationships)
- Pulling changes that include query modifications

## Troubleshooting

### "Connection refused" or similar network errors
Ensure Hasura is running:
```bash
docker-compose up hasura
```

### Types not updating
Clear and regenerate:
```bash
rm -rf frontend-nx/apps/edu-hub/queries/__generated__/*
cd /home/steffen/git/eduhub/frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn nx run edu-hub:apollo 2>&1 | tail -50
```

## Generated Files Location

- edu-hub: `frontend-nx/apps/edu-hub/queries/__generated__/`
- rent-a-scientist: `frontend-nx/apps/rent-a-scientist/queries/__generated__/`

## Related Skills

If you're making database schema changes, ensure you also:
1. Create migrations using the `create-migration` skill
2. Update Hasura metadata if adding tables/relationships
3. THEN regenerate types using this skill
