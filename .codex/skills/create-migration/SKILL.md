---
name: create-migration
description: Create and review EduHub Hasura schema migrations. Use when adding tables, columns, constraints, relationships, or other database schema changes, and when coordinating the required metadata, query, type-generation, and function follow-up steps.
---
# Create Migration

Use this skill for any EduHub schema change.

## Required Workflow

Do not consider a schema-change task complete until all relevant steps are done:

1. Create the SQL migration directory in `backend/migrations/default/`
2. Add both `up.sql` and `down.sql`
3. Update Hasura metadata if tables, relationships, or permissions changed
4. Update GraphQL queries or fragments affected by the schema change
5. Regenerate GraphQL types
6. Scan `functions/` for affected table or column usage and update function logic if needed

## Migration Folder Naming

Use:

```text
backend/migrations/default/{timestamp}_{action}_{description}/
```

Examples:

```text
backend/migrations/default/1753957404053_add_column_status_to_mail_log/
backend/migrations/default/1753957404053_create_table_AttendanceAudit/
```

## SQL Expectations

- `up.sql` should do the real change
- `down.sql` should reverse it cleanly
- new tables should include a table comment where practical
- keep the SQL narrow and explicit; do not mix unrelated schema changes in one migration

## Metadata And Query Follow-Up

After schema changes:

- update `backend/metadata/` when permissions, tables, or relationships changed
- update queries in `frontend-nx/apps/edu-hub/queries/` if field shape changed
- use the `regenerate-types` skill for codegen

## Function Impact Scan

This repo has serverless consumers under `functions/`.

For every changed table or column:

- search `functions/` for the old and new names
- update GraphQL queries or business logic where needed
- pay special attention to `functions/callNodeFunction/`, `functions/sendMail/`, and related modules

Suggested search:

```text
rg "<table_or_column_name>" functions/
```

## Naming Conventions

- tables: PascalCase
- columns: camelCase
- timestamp fields: usually `created_at`, `updated_at`
- foreign keys: `{tableName}Id`

## Output Style For This Skill

When asked to make a schema change, carry the work through this checklist and
state clearly which of the six required follow-up steps were completed.
