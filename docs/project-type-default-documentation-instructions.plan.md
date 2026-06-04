# Project type default documentation instructions

## Goal

Each `ProjectType` has exactly one default `ProjectDocumentationInstruction`. Each
instruction is scoped to a single `ProjectType`. Instructors and admins see a
dropdown filtered to the selected type's instructions with the default marked,
and the default is auto-applied whenever the project type changes. Two new
project types add presentation/link flows whose documentation upload is
optional.

## Final data model

Single source of truth on the instruction:

- `ProjectDocumentationInstruction.projectTypeValue text NOT NULL` →
  FK to `ProjectType.value` (`ON UPDATE/DELETE RESTRICT`).
- `ProjectDocumentationInstruction.isDefault boolean NOT NULL DEFAULT false`.
- Partial unique index ensures **at most one** default per type:
  `UNIQUE (projectTypeValue) WHERE isDefault`.
- `ProjectDocumentationInstruction.url text` becomes NULLABLE so an
  instruction row can exist before its PDF is uploaded.
- `Project` gets a `BEFORE INSERT OR UPDATE` trigger asserting that
  `documentationInstructionId`'s `projectTypeValue` matches `Project.type`
  whenever both are set.

"Exactly one" is enforced **operationally**:

- Seed creates one default per type.
- Admin UI only exposes `Set as default` (no `Unset default` action).
- Cannot delete the row currently marked default (UI guard +
  `ON DELETE RESTRICT` from `Project.documentationInstructionId`).

## Project type catalog (after migration)

| value | requiresDocumentation | requiresPresentation | requiresExternalUrl | requiresCoverImage |
|---|---|---|---|---|
| ONLINE_COURSE | yes | no | no | no |
| CLASSIC_PROJECT | yes | no | no | no |
| PROJECT_WITH_LINK | yes | no | yes | yes |
| PROJECT_WITH_PRESENTATION | yes | yes | no | yes |
| PROJECT_WITH_LINK_AND_PRESENTATION | yes | yes | yes | yes |
| **PRESENTATION_WITHOUT_DOCUMENTATION** *(new)* | no | yes | no | yes |
| **PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION** *(new)* | no | yes | yes | yes |

The two new types behave like the regular documentation types except that
documentation upload is **not mandatory for completion**. All UI sections that
the existing documentation types render (documentation upload, presentation
upload, external URL, cover image) continue to render — the existing
`requiresDocumentation`-aware checks in `SubmissionChecklist`,
`projectMandatory`, and `ProjectNextTodos` already handle the "optional
documentation" semantic. `ONLINE_COURSE` keeps its own UI (no team formation,
copy-to-ONGOING) and is not affected.

The DB check `Project_ongoing_requires_type_and_instruction_check` is kept
unchanged: every non-PROPOSED project still requires a
`documentationInstructionId`. The PDF for no-documentation types describes the
presentation/link/cover deliverables.

## Migration plan (single migration)

`backend/migrations/default/1779400000000_project_documentation_instruction_per_type_default/`

**up.sql**

1. Insert two new `ProjectType` rows with the flags above.
2. `ALTER TABLE "ProjectDocumentationInstruction"`:
   - `ADD COLUMN "projectTypeValue" text` (nullable initially).
   - `ADD COLUMN "isDefault" boolean NOT NULL DEFAULT false`.
   - `ALTER COLUMN "url" DROP NOT NULL`.
3. (User confirmed) Wipe `ProjectDocumentationInstruction` rows (none exist in
   staging/production) so the next steps can `SET NOT NULL` cleanly.
4. Insert seven `ProjectDocumentationInstruction` rows (one per type,
   `url = NULL` placeholder, `isDefault = true`).
5. `ALTER COLUMN "projectTypeValue" SET NOT NULL`.
6. Add FK `projectTypeValue` → `ProjectType(value)` ON UPDATE/DELETE RESTRICT.
7. Create index on `projectTypeValue`.
8. Create partial unique index on `(projectTypeValue) WHERE isDefault`.
9. Create `Project_instruction_matches_type_trg` (BEFORE INSERT OR UPDATE on
   `Project`) that raises when `documentationInstructionId`'s
   `projectTypeValue` differs from `Project.type`.

**down.sql**: drop trigger, drop indexes, drop FK, drop columns, drop seed
rows, delete two new types (raises if referenced by any Project or Program).

## Hasura metadata

- `public_ProjectDocumentationInstruction.yaml`:
  add `projectTypeValue`, `isDefault` to select columns for `anonymous`,
  `user_access`, `instructor_access`; add object relationship
  `ProjectType` (`projectTypeValue` → `ProjectType.value`).
- `public_ProjectType.yaml`:
  add array relationship `ProjectDocumentationInstructions`
  (`projectTypeValue` ← `ProjectDocumentationInstruction.projectTypeValue`).
- `actions.yaml` + `actions.graphql`:
  - `saveProjectDocumentationInstruction(base64file, filename,
    projectDocumentationInstructionId)` → `saveFileResult`,
    path `project-docs-instructions/public/instruction-${id}/${filename}`,
    public.
  - `setProjectDocumentationInstructionDefault(instructionId: Int!)` →
    `SetProjectDocumentationInstructionDefaultResult`, admin only.

## Action handler `setProjectDocumentationInstructionDefault`

- Admin role only.
- One atomic UPDATE statement:
  ```sql
  UPDATE "ProjectDocumentationInstruction"
     SET "isDefault" = (id = $1)
   WHERE "projectTypeValue" =
     (SELECT "projectTypeValue"
        FROM "ProjectDocumentationInstruction"
       WHERE id = $1);
  ```
- The partial unique index is satisfied throughout because the row that drops
  `isDefault` and the row that gains it are updated in the same statement.

## GraphQL & frontend changes

- Extend `PROJECT_DOCUMENTATION_INSTRUCTIONS` query: add `projectTypeValue`,
  `isDefault`.
- New `queries/projectDocumentationInstruction.ts`:
  insert / update title / delete / set default / save PDF (action).
- `AddProjectDialog` and `ConfirmProjectDialog`:
  - On type change, set `instructionId` to the new type's default
    (`projectTypeValue === type && isDefault === true`).
    Always overwrite, even when manually changed.
  - Filter dropdown to instructions where
    `projectTypeValue === selectedType`.
  - Sort default first, then by title; append a translated suffix
    `" (default)" / " (Standard)"` to the default option's label.
- App-settings admin section
  (`components/pages/ManageAppSettingsContent/ProjectDocumentationInstructionsSection.tsx`):
  - `TableGrid` with columns: Title (editable), Project type, Default toggle,
    PDF (FileUploadField), Actions.
  - `Add new instruction` dialog: project type (select) + title.
  - `Set as default` button per row (disabled on row that is already default).
  - Delete button disabled when `isDefault === true`.
- Locales: add new type labels (DE/EN, Du form), default suffix, app-settings
  section keys.

## PDFs

Default bilingual copy lives in
`frontend-nx/apps/edu-hub/public/project-documentation-instructions/source/`
(export to `../<TYPE>.pdf`). The migration seeds `url` as
`/project-documentation-instructions/<TYPE>.pdf`. Custom or replaced
instructions use the `saveProjectDocumentationInstruction` action (GCS).

## Verification checklist

- Seven types each have exactly one row with `isDefault = true`.
- Partial unique index rejects a second `isDefault = true` for the same type.
- `setProjectDocumentationInstructionDefault` swaps defaults atomically.
- Cannot insert/update a `Project` whose `documentationInstructionId`
  belongs to a different `projectTypeValue` than `Project.type`.
- Admin UI: delete button disabled on default rows; uploading a PDF stores its
  public URL on the instruction.
- AddProjectDialog / ConfirmProjectDialog: switching project type sets the
  documentation instruction to the type's default and the dropdown lists only
  that type's instructions, with the default labelled.

## Out of scope

- Per-program instruction override.
- Per-locale PDF files.
- `PROJECT_WITH_LINK_WITHOUT_DOCUMENTATION` (not requested).
- Refactoring `MyProjectPanel`'s `isOnlineCourseProject`-based gates.
