---
description: Guide for adding new database tables and columns to EduHub
globs: 
alwaysApply: false
---

# Database Table and Column Creation Guide

This guide covers the complete process for adding new database tables and columns to the EduHub project, following established naming conventions and integration patterns.

## Naming Conventions

### Tables
- **Use PascalCase** for table names: `FaqCollection`, `CourseEnrollment`, `UserOccupation`
- Follow existing patterns in `backend/metadata/databases/default/tables/tables.yaml`

### Columns
- **Use camelCase** for regular columns: `collectionId`, `firstName`, `organizationId`
- **Use snake_case** for timestamps: `created_at`, `updated_at`
- **Primary keys**: 
  - **Data tables**: Always use `id` with serial (integer) type + `PRIMARY KEY ("id")`
  - **Enum/lookup tables**: May use `value` field as primary key (e.g., `Language`, `CourseStatus`)
- **Foreign keys**: Use `{tableName}Id` format (e.g., `userId`, `courseId`)

### Example Table Structure
```sql
CREATE TABLE "public"."ExampleTable" (
  "id" serial NOT NULL,
  "parentId" integer NOT NULL,                 -- Foreign key (camelCase)
  "name" text NOT NULL,                        -- Regular column (camelCase)
  "isActive" boolean NOT NULL DEFAULT true,    -- Boolean column (camelCase)
  "created_at" timestamptz NOT NULL DEFAULT now(),  -- Timestamp (snake_case)
  "updated_at" timestamptz NOT NULL DEFAULT now(),  -- Timestamp (snake_case)
  PRIMARY KEY ("id")
);
```

## Step-by-Step Process

### 1. Create Database Migrations

Create migration files with timestamps in `backend/migrations/default/`:

```bash
# Generate timestamp
date +%s%3N
# Example: 1753957404053
```

#### Migration Files Structure
```
backend/migrations/default/
├── {timestamp}_create_table_public_{TableName}/
│   ├── up.sql      # Create table and constraints
│   └── down.sql    # Drop table
```

#### up.sql Template
```sql
-- Create table
CREATE TABLE "public"."TableName" (
  "id" serial NOT NULL,
  "foreignKeyId" integer NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("name")  -- Add unique constraints as needed
);

-- Add table comment
COMMENT ON TABLE "public"."TableName" IS E'Description of what this table stores';

-- Add foreign key constraints
ALTER TABLE "public"."TableName" 
ADD CONSTRAINT "TableName_foreignKeyId_fkey" 
FOREIGN KEY ("foreignKeyId") REFERENCES "public"."ParentTable"("id") 
ON UPDATE RESTRICT ON DELETE CASCADE;

-- Add indexes if needed
CREATE INDEX "TableName_foreignKeyId_idx" ON "public"."TableName"("foreignKeyId");
```

#### down.sql Template
```sql
DROP TABLE "public"."TableName";
```

### 2. Create Sample Data Migration (Optional)

For tables that need initial data:

#### Simple Insert
```sql
-- Insert sample data
INSERT INTO "public"."TableName"("name", "foreignKeyId") 
VALUES 
  ('Sample 1', (SELECT id FROM "public"."ParentTable" WHERE name = 'parent1')),
  ('Sample 2', (SELECT id FROM "public"."ParentTable" WHERE name = 'parent2'));
```

#### Complex Insert with ID Capture (for related data)
```sql
-- Insert complex related data
DO $$
DECLARE
    parent_id integer;
    item1_id integer;
    item2_id integer;
BEGIN
    -- Get parent ID
    SELECT id INTO parent_id FROM "public"."ParentTable" WHERE name = 'default';
    
    -- Insert items and capture their IDs
    INSERT INTO "public"."TableName" ("parentId", "name") VALUES (parent_id, 'Item 1') RETURNING id INTO item1_id;
    INSERT INTO "public"."TableName" ("parentId", "name") VALUES (parent_id, 'Item 2') RETURNING id INTO item2_id;
    
    -- Insert related data using captured IDs
    INSERT INTO "public"."RelatedTable" ("itemId", "lang", "title") VALUES
    (item1_id, 'DE', 'Titel 1'),
    (item1_id, 'EN', 'Title 1'),
    (item2_id, 'DE', 'Titel 2'),
    (item2_id, 'EN', 'Title 2');
END $$;
```

### 3. Create Hasura Metadata Files

Create metadata files in `backend/metadata/databases/default/tables/`:

#### public_TableName.yaml Template
```yaml
table:
  name: TableName
  schema: public
object_relationships:
  - name: ParentTable
    using:
      foreign_key_constraint_on: foreignKeyId
array_relationships:
  - name: ChildTables
    using:
      foreign_key_constraint_on:
        column: parentId
        table:
          name: ChildTable
          schema: public
select_permissions:
  - role: anonymous
    permission:
      columns:
        - id
        - name
        - created_at
        - updated_at
      filter: {}
      allow_aggregations: true
  - role: user_access
    permission:
      columns:
        - id
        - name
        - foreignKeyId
        - created_at
        - updated_at
      filter: {}
      allow_aggregations: true
```

#### Update tables.yaml
Add your new table to `backend/metadata/databases/default/tables/tables.yaml`:

```yaml
- "!include public_TableName.yaml"
```

Keep alphabetical order in the list.

### 4. Apply Migrations and Metadata

```bash
cd backend

# Apply database migrations
hasura migrate apply

# Apply Hasura metadata (tracks tables in GraphQL)
hasura metadata apply
```

### 5. Create GraphQL Queries

Create query files in `frontend-nx/apps/edu-hub/queries/`:

```typescript
import { gql } from "@apollo/client";

export const GET_TABLE_ITEMS = gql`
  query GetTableItems($limit: Int) {
    TableName(limit: $limit, order_by: {created_at: desc}) {
      id
      name
      ParentTable {
        id
        name
      }
      created_at
      updated_at
    }
  }
`;

export const GET_TABLE_ITEM_BY_ID = gql`
  query GetTableItemById($id: Int!) {
    TableName_by_pk(id: $id) {
      id
      name
      foreignKeyId
      ParentTable {
        id
        name
      }
      created_at
      updated_at
    }
  }
`;
```

### 6. Generate TypeScript Types

```bash
# Regenerate GraphQL types
sudo bash regenerate-apollo.sh $USER
```

### 7. Common Patterns

#### Translation Tables Pattern
For multilingual content, use the translation table pattern:

```sql
-- Main entity table
CREATE TABLE "public"."Entity" (
  "id" serial NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Translation table
CREATE TABLE "public"."EntityTranslation" (
  "id" serial NOT NULL,
  "entityId" integer NOT NULL,
  "lang" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("entityId", "lang")
);

-- Foreign key to Language table
ALTER TABLE "public"."EntityTranslation" 
ADD CONSTRAINT "EntityTranslation_lang_fkey" 
FOREIGN KEY ("lang") REFERENCES "public"."Language"("value") 
ON UPDATE RESTRICT ON DELETE RESTRICT;
```

#### Junction Tables Pattern
For many-to-many relationships:

```sql
CREATE TABLE "public"."TableOneTableTwo" (
  "id" serial NOT NULL,
  "tableOneId" integer NOT NULL,
  "tableTwoId" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("tableOneId", "tableTwoId")
);
```

## Troubleshooting

### Migration Fails
- Check foreign key references exist
- Verify Language table values match (use 'DE', 'EN' not 'de', 'en')
- Ensure unique constraints don't conflict with existing data

### GraphQL Schema Issues
- Verify metadata files are created and included in tables.yaml
- Run `hasura metadata apply` after creating metadata files
- Check Hasura console for relationship errors

### Type Generation Fails
- Ensure all referenced tables exist in the schema
- Check GraphQL query syntax
- Verify table and column names match exactly

## Examples from Codebase

See these existing implementations:
- **Simple table**: `Language`, `LocationOption`
- **With relationships**: `Course`, `CourseEnrollment`
- **Translation pattern**: `FaqCollection`, `Faq`, `FaqTranslation`
- **Junction table**: `CourseInstructor`, `CourseGroup`

## Best Practices

1. **Always create down.sql** for migration rollbacks
2. **Every data table MUST have `PRIMARY KEY ("id")`** - this is essential for Hasura and GraphQL
3. **Add table comments** to document purpose
4. **Use meaningful constraint names** following the pattern `TableName_column_fkey`
5. **Set appropriate permissions** in metadata files
6. **Order foreign keys** after table creation to avoid dependency issues
6. **Test with sample data** before committing
7. **Follow semantic release** commit message format for version bumping