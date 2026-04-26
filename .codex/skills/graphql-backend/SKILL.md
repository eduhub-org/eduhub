---
name: graphql-backend
description: Apply EduHub GraphQL, Hasura, and schema-change conventions. Use when editing queries, mutations, fragments, metadata, role-based GraphQL hooks, or backend changes that affect frontend GraphQL usage.
---
# GraphQL Backend

Use this skill for GraphQL and Hasura-facing work in EduHub.

## Critical Hook Rule

Do not use `useAuthedQuery`.

Use role-aware hooks instead:

- `useRoleQuery`
- `useRoleMutation`
- `useAdminQuery`
- `useAdminMutation`
- `useInstructorQuery`

Reason: hardcoding the `user` role can produce incorrect Hasura permission behavior.

## Query And Mutation Structure

Keep GraphQL code organized under the repo's query structure:

- fragments
- queries
- mutations

Use fragments for reusable field groups and fetch only the fields actually needed.

## Schema-Change Coordination

If the task touches backend schema or permissions, do not stop at the query file.

Coordinate across:

- `backend/migrations/`
- `backend/metadata/`
- `frontend-nx/apps/edu-hub/queries/`
- generated GraphQL types
- `functions/` consumers when relevant

Read `references/hasura-schema-change-checklist.md` for the full checklist.

## Good Patterns

- use `skip` for conditional queries
- add explicit error handling on mutations
- regenerate types after changing schema or documents
- verify permissions for the actual role that will execute the query

## Output Style For This Skill

When making GraphQL-related changes, state which layers were affected:

1. query or mutation documents
2. metadata or permissions
3. generated types
4. downstream function consumers
