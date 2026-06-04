Regenerate GraphQL TypeScript types after any schema or query change.

## Prerequisite

Hasura must be reachable at `http://localhost:8080/v1/graphql`. Start it with
`docker compose up` if it is not.

## Command

Run from `frontend-nx/`:

```bash
GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo
```

The `apollo` script (defined in `frontend-nx/package.json`) wipes and rebuilds
`frontend-nx/apps/edu-hub/queries/__generated__/` by running
`apollo client:codegen` over every `.ts` GraphQL document under
`frontend-nx/apps/edu-hub/queries/**`.

## When to run

- A new SQL migration has been applied (changed columns, new tables).
- Hasura metadata changed (new tracked table, permissions, relationships).
- A GraphQL `gql\`...\`` document (query, mutation, fragment) was added or
  edited.
- After pulling a branch that includes any of the above.

## Troubleshooting

- "ECONNREFUSED": Hasura is not running. `docker compose up hasura` first.
- Types are stale or missing: the `apollo` script already removes
  `queries/__generated__/` before regeneration, so a stale cache is unusual —
  but you can force a clean run with the same command.
- "Cannot query field X": metadata isn't tracking the new column. Run
  `docker compose exec hasura hasura-cli metadata apply` and retry.

## Output reporting

When invoked, mention:
1. whether Hasura was reachable
2. whether codegen completed
3. whether any files under `queries/__generated__/` changed (the answer should
   be yes if a relevant document or the schema changed)
