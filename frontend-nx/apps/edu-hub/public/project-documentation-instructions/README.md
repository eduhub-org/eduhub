# Project documentation instructions (default PDFs)

This folder holds the **eight default** instruction PDFs shipped with EduHub.
They are linked from the seeded `ProjectDocumentationInstruction` rows created
by migrations `1779400000000_project_documentation_instruction_per_type_default`
and `1787095331230_add_project_type_documentation_only`.

## Default vs custom instructions

| Kind | Where the file lives | Typical `url` in the database |
|---|---|---|
| **Defaults (this folder)** | Git → Next.js `public/` → served as static assets | `/project-documentation-instructions/<TYPE>.pdf` |
| **Custom / replaced** | **Google Cloud Storage** (Hasura `saveProjectDocumentationInstruction` action) | Bucket path, e.g. `project-docs-instructions/public/instruction-<id>/…` |

Admins manage all instruction **rows** (title, default flag, uploads) under
**/manage/app-settings**. Uploading a PDF for a row stores it in GCS and
**overwrites** that row’s `url`; the static file in this folder is then unused
for that row.

`FileDownload` in the admin UI opens `/…` and `http(s)://` links directly;
bucket paths are opened via a signed URL.

## Source content (markdown)

Bilingual copy to export as PDF: **`source/`** (one `.md` per type). See
`source/README.md` for Pandoc export and AcroForm notes for `ONLINE_COURSE`.

## PDF filenames (place exports in this folder)

- `ONLINE_COURSE.pdf`
- `CLASSIC_PROJECT.pdf`
- `PROJECT_WITH_DOCUMENTATION_ONLY.pdf`
- `PROJECT_WITH_LINK.pdf`
- `PROJECT_WITH_PRESENTATION.pdf`
- `PROJECT_WITH_LINK_AND_PRESENTATION.pdf`
- `PRESENTATION_WITHOUT_DOCUMENTATION.pdf`
- `PRESENTATION_AND_LINK_WITHOUT_DOCUMENTATION.pdf`

Names match `ProjectType.value` so the migration can map type → file.

## Deleting default rows in app-settings

**No runtime error** if you replace defaults sensibly:

1. Add or upload a new instruction for the same project type.
2. Use **Set as default** so the seeded row is no longer `isDefault`.
3. Delete the old row only when the delete button is enabled (not default).

**Delete is blocked in the UI** while `isDefault === true`.

**Database:** if any `Project` still references that instruction id,
`ON DELETE RESTRICT` on `Project.documentationInstructionId` causes delete to
**fail** (foreign-key error — shown in the admin dialog, not a crash).

**Gaps (no hard error, but broken workflow):**

- Deleting the **last** instruction for a type leaves an empty dropdown and no
  auto-fill when instructors set the project type.
- Projects already in a non-`PROPOSED` status still need a
  `documentationInstructionId`; do not delete rows that active projects use.

Removing PDF files from this git folder only breaks **links** for rows that
still point at `/project-documentation-instructions/…` (404 in the browser).
