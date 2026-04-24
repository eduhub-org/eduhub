---
name: regenerate-types
description: Regenerate EduHub GraphQL TypeScript types. Use after GraphQL schema changes, query or mutation edits, metadata changes, or when updating generated query types from Hasura.
---
# Regenerate Types

Use this skill when GraphQL documents or the underlying schema changed.

## Prerequisite

Hasura must be running and reachable at:

```text
http://localhost:8080/v1/graphql
```

## Command

Run from `frontend-nx`:

```bash
GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo
```

## When To Run

Run codegen after:

- new queries or mutations
- changed fragments
- schema migrations or metadata changes
- pulled changes that modified generated GraphQL surfaces

## Troubleshooting

- If Hasura is not running, start the stack first.
- If generated output looks stale, clear the generated directory and rerun codegen.
- If the task involved schema changes, pair this skill with `create-migration`.

## Output Style For This Skill

When you use this skill, mention:

1. whether Hasura was available
2. whether codegen was run successfully
3. whether any generated files changed
