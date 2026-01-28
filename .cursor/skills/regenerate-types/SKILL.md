---
name: regenerate-types
description: Regenerate TypeScript types from GraphQL schema using Apollo codegen. Use when the user asks to update types, regenerate types, run codegen, or after GraphQL schema changes.
---
# Regenerate GraphQL Types

## Prerequisites

- Docker containers must be running (`docker-compose up`)

## Quick Command

```bash
# From project root
./regen
```

This script:
1. Runs Apollo codegen inside the Docker container
2. Automatically fixes file permission issues (root-owned files)

## When to Run

Run codegen after:
- Adding new GraphQL queries or mutations
- Modifying existing queries
- Backend schema changes (new tables, columns, relationships)
- Pulling changes that include query modifications

## Alternative: Run Inside Container

If you're already inside the container or prefer manual execution:

```bash
# From frontend-nx directory
cd frontend-nx
yarn nx run edu-hub:apollo

# For rent-a-scientist app
yarn nx run rent-a-scientist:apollo
```

## Troubleshooting

### "Container not running"
Start the containers first:
```bash
docker-compose up frontend-nx hasura
```

### Permission issues after codegen
The `./regen` script handles this automatically. If running manually:
```bash
sudo chown $USER:$USER -R .
```

### Types not updating
Clear and regenerate:
```bash
rm -rf frontend-nx/apps/edu-hub/queries/__generated__/*
./regen
```

## Generated Files Location

- edu-hub: `frontend-nx/apps/edu-hub/queries/__generated__/`
- rent-a-scientist: `frontend-nx/apps/rent-a-scientist/queries/__generated__/`
