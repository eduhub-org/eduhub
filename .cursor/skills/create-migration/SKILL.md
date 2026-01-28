---
name: create-migration
description: Create Hasura database migrations for EduHub. Use when adding tables, columns, constraints, or any database schema changes. Also use after schema changes to ensure migrations are created.
---
# Create Hasura Database Migration

## When to Use

Use this skill when:
- Adding new database tables
- Adding or removing columns
- Modifying constraints or indexes
- Any database schema change is required

## Step 1: Generate Migration Timestamp

```bash
date +%s%3N
```

Example output: `1753957404053`

## Step 2: Create Migration Directory

Create the migration folder with the timestamp:

```bash
mkdir -p /home/steffen/git/eduhub/backend/migrations/default/{TIMESTAMP}_{description}
```

Replace:
- `{TIMESTAMP}` with the generated timestamp
- `{description}` with a snake_case description (e.g., `add_column_scheduledAt_to_MailLog`)

## Step 3: Create up.sql

Create `up.sql` with the schema changes:

### Adding a Column
```sql
ALTER TABLE "public"."TableName" ADD COLUMN "columnName" text;
```

### Removing a Column
```sql
ALTER TABLE "public"."TableName" DROP COLUMN "columnName";
```

### Creating a Table
```sql
CREATE TABLE "public"."TableName" (
  "id" serial NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
```

## Step 4: Create down.sql

Create `down.sql` to reverse the changes:

### If up.sql adds a column
```sql
ALTER TABLE "public"."TableName" DROP COLUMN "columnName";
```

### If up.sql removes a column
```sql
ALTER TABLE "public"."TableName" ADD COLUMN "columnName" text;
```

### If up.sql creates a table
```sql
DROP TABLE "public"."TableName";
```

## Step 5: Update Hasura Metadata (If Needed)

For new tables or relationships, create/update metadata files in:
`backend/metadata/databases/default/tables/`

See the `database-table-creation.md` rule for metadata templates.

## Step 6: Regenerate TypeScript Types (MANDATORY)

After ANY schema change that affects GraphQL, regenerate types:

```bash
cd /home/steffen/git/eduhub/frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn nx run edu-hub:apollo 2>&1 | tail -50
```

**Note**: Hasura must be running at `http://localhost:8080/v1/graphql` for this to work.

## Naming Conventions

- **Tables**: PascalCase (`UserProfile`, `CourseEnrollment`)
- **Columns**: camelCase (`firstName`, `organizationId`)
- **Timestamps**: snake_case (`created_at`, `updated_at`)
- **Foreign keys**: `{tableName}Id` (`userId`, `courseId`)
- **Migration folders**: `{timestamp}_{action}_{description}` (`1753957404053_add_column_status_to_MailLog`)

## Checklist

Before considering a schema-change task complete:

- [ ] Migration `up.sql` created with correct SQL
- [ ] Migration `down.sql` created to reverse changes
- [ ] Hasura metadata updated (if adding tables/relationships)
- [ ] TypeScript types regenerated
- [ ] GraphQL queries updated (if field names changed)
