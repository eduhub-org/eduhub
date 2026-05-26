Create and apply a Hasura database migration in EduHub.

A schema change is **not done** until all six steps in this file are complete.

## Naming conventions (match existing tables)

- Table names: **PascalCase**, quoted in SQL: `"ProjectAuthor"`.
- Regular columns: **camelCase**: `"projectId"`, `"isActive"`.
- Timestamp columns: **snake_case**: `"created_at"`, `"updated_at"`.
- Primary key column: `"id"` (`serial` for data tables, or `uuid` where the
  schema uses it). Enum/lookup tables may use `"value"` text as the PK
  (e.g. `Language`, `CourseStatus`).
- Foreign keys: `{tableName}Id` (camelCase): `"userId"`, `"courseId"`.
- Constraint names: `TableName_column_fkey` / `_idx` / `_unique`.
- Never add `admin` role permissions in metadata — `admin` has full access by
  default in this repo.

## 1. Create the migration directory

```bash
date +%s%3N   # e.g. 1778624424783
```

```
backend/migrations/default/{timestamp}_{verb}_{description}/
  up.sql
  down.sql
```

Verbs follow existing patterns: `create_table_public_{Name}`,
`alter_table_public_{Name}_add_column_{column}`,
`drop_table_public_{Name}`, `set_fk_public_{Name}_{column}`.

## 2. Write `up.sql`

Create-table template (mirrors `ProjectAuthor`, `FaqCollection`, etc.):

```sql
CREATE TABLE "public"."MyTable" (
  "id"             serial      NOT NULL,
  "courseId"       integer     NOT NULL,
  "name"           text        NOT NULL,
  "isActive"       boolean     NOT NULL DEFAULT true,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

COMMENT ON TABLE "public"."MyTable" IS E'Short purpose statement.';

ALTER TABLE "public"."MyTable"
  ADD CONSTRAINT "MyTable_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id")
  ON UPDATE RESTRICT ON DELETE CASCADE;

CREATE INDEX "MyTable_courseId_idx" ON "public"."MyTable" ("courseId");
```

For `updated_at` to update automatically, attach the shared trigger that the
repo already uses (see `ProjectAuthor/up.sql` for the canonical block):

```sql
CREATE TRIGGER "set_public_MyTable_updated_at"
BEFORE UPDATE ON "public"."MyTable"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
```

The function `public.set_current_timestamp_updated_at()` already exists in the
schema — do not redefine it unless you are creating the very first migration
that introduces it.

## 3. Write `down.sql`

`down.sql` must fully reverse `up.sql`:

```sql
DROP TABLE IF EXISTS "public"."MyTable";
```

For column adds, drop the column; for FK adds, drop the constraint; etc.

## 4. Update Hasura metadata

Create `backend/metadata/databases/default/tables/public_MyTable.yaml`:

```yaml
table:
  name: MyTable
  schema: public
object_relationships:
  - name: Course
    using:
      foreign_key_constraint_on: courseId
select_permissions:
  - role: user
    permission:
      columns: [id, courseId, name, created_at, updated_at]
      filter: {}
      allow_aggregations: true
insert_permissions:
  - role: instructor
    permission:
      check: {}
      columns: [courseId, name]
```

Include the file in `backend/metadata/databases/default/tables/tables.yaml`
(keep entries alphabetical):

```yaml
- "!include public_MyTable.yaml"
```

Do **not** add an `admin` block — admin has full access by default.

## 5. Apply migration and metadata

```bash
docker compose exec hasura hasura-cli migrate apply --database-name default
docker compose exec hasura hasura-cli metadata apply
```

Restart instead if the CLI is unhappy: `docker compose down && docker compose up`.

## 6. Update queries, regenerate types, scan functions

- Add or update GraphQL documents under
  `frontend-nx/apps/edu-hub/queries/` so the new fields are actually used.
- Regenerate types (see `/regenerate-types`):

  ```bash
  cd frontend-nx && GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo
  ```

- Scan serverless consumers for stale names — required for any rename or
  removal:

  ```bash
  rg "MyTable|myColumn" functions/
  ```

  Update `functions/callNodeFunction/*`, `functions/sendMail/*`, and any other
  affected modules.

## Common patterns

- **Translation tables**: pair `Entity` + `EntityTranslation(entityId, lang, ...)`
  with `UNIQUE (entityId, lang)` and FK on `lang` → `Language.value`
  (values are `'DE'`/`'EN'`, not `'de'`/`'en'`).
- **Junction tables**: `TableOneTableTwo(id, tableOneId, tableTwoId)` with
  `UNIQUE (tableOneId, tableTwoId)`.

## Done checklist

- [ ] `up.sql` makes the change
- [ ] `down.sql` reverses it
- [ ] Table comment added (for new tables)
- [ ] Metadata YAML created and included in `tables.yaml`
- [ ] Relationships defined for every FK column
- [ ] Permissions set per role (no `admin` block)
- [ ] `hasura-cli migrate apply` and `metadata apply` succeeded
- [ ] Frontend GraphQL documents updated
- [ ] `yarn apollo` regenerated types
- [ ] `rg` in `functions/` for affected names — updated where matched

When reporting back, state which of these six categories you completed.
