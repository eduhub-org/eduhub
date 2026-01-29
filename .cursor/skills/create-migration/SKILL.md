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

**GNU/Linux:**
```bash
date +%s%3N
```

**macOS/BSD (alternative):**
```bash
python3 -c "import time; print(int(time.time() * 1000))"
```

**Note**: The `date +%s%3N` command works on GNU/Linux systems but not on macOS/BSD due to differences in the `date` command. macOS users should use the Python one-liner instead.

Example output: `1753957404053`

## Step 2: Create Migration Directory

Create the migration folder with the timestamp:

```bash
mkdir -p backend/migrations/default/{timestamp}_{action}_{description}
```

Replace:
- `{timestamp}` with the generated timestamp
- `{action}` with the action type (e.g., `add_column`, `remove_column`, `create_table`)
- `{description}` with a snake_case description (e.g., `scheduled_at_to_MailLog`)

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

After ANY schema change that affects GraphQL, regenerate types using the `regenerate-types` skill.

**Note**: Hasura must be running at `http://localhost:8080/v1/graphql` for this to work. See the `regenerate-types` skill for the complete command and troubleshooting steps.

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
