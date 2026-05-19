Create a GitHub issue on `eduhub-org/eduhub` and add it to the
"EduHub Development" project board with a chosen Status.

## Target

- **Repo**: `eduhub-org/eduhub`
- **Project**: "EduHub Development", number `4`, ID `PVT_kwDOBMmEKM4ANN95`
- **Status field ID**: `PVTSSF_lADOBMmEKM4ANN95zgIb1OI`

If you suspect the IDs have drifted (renamed columns, new project), refresh:

```bash
gh project list --owner eduhub-org
gh project field-list 4 --owner eduhub-org --format json
```

## Prerequisites

`gh` CLI must be authenticated with scopes `repo`, `project`, `read:project`
(plus the default `gist`, `read:org`, `workflow`):

```bash
gh auth status
```

If the user is missing project scopes, ask them to run in their own terminal:

```bash
gh auth refresh -s project,read:project
```

## Steps

### 1. Write the issue body to a file

Always use `--body-file` (not `--body`) so multi-line markdown with backticks
renders correctly. Use the Write tool to create `/tmp/<short_name>.md`.

Recommended body skeleton (match recent issues; link files with line numbers
where useful):

```markdown
### Summary
[Problem + proposed solution, 2-4 paragraphs.]

### Background / current state
- [Concrete file references like
  `[Projects/index.tsx](frontend-nx/apps/edu-hub/components/pages/CourseContent/Projects/index.tsx) line 118`]

### Proposed scope

#### Backend
...

#### GraphQL / queries
...

#### Frontend
...

#### i18n
...

### Acceptance criteria
- [ ] ...

### Resolved decisions
- ...

### Dependencies / follow-ups
- ...

### Out of scope
- ...

### References
- ...
```

### 2. Create the issue

```bash
gh issue create \
  --repo eduhub-org/eduhub \
  --title "<concise title>" \
  --body-file /tmp/<short_name>.md
```

Parse the issue URL/number from the output.

### 3. Add to the project board

```bash
gh project item-add 4 \
  --owner eduhub-org \
  --url <issue_url> \
  --format json
```

Capture the `id` field — the **item ID** (`PVTI_lADOBMmEKM4ANN95zg...`).

### 4. Set the Status

```bash
gh project item-edit \
  --project-id PVT_kwDOBMmEKM4ANN95 \
  --id <item_id> \
  --field-id PVTSSF_lADOBMmEKM4ANN95zgIb1OI \
  --single-select-option-id <status_option_id>
```

| Status      | Option ID  |
|-------------|------------|
| Backlog     | `72a55bef` |
| Todo        | `f75ad846` |
| In Progress | `47fc9ee4` |
| Done        | `98236657` |

Default to **Backlog** unless the user says otherwise.

### 5. Report

Return the issue URL and confirm it is on the project board with the chosen
status.

## Multiple related issues

If you create related issues (e.g. parent + follow-up):

1. Create issue 1, capture its number.
2. Substitute `#<issue_1_number>` into issue 2's body before creating it.
3. After issue 2 exists, optionally `gh issue edit <issue_1_number> --body-file ...`
   to add a back-link.

## Common auth issues

- **"token is invalid" in a sandbox but works in a real terminal**: the token
  is stored in the OS keyring (`Logged in to github.com account ... (keyring)`),
  which the sandbox can't reach. Re-run with elevated permissions
  (`required_permissions: ["all"]`).
- **"missing required scopes [project] / [read:project]"**: refresh scopes
  with `gh auth refresh -s project,read:project`, then retry.

## Anti-patterns

- **Don't** use `gh issue create --body "..."` with inline multi-line text —
  quoting breaks on backticks and code fences. Always `--body-file`.
- **Don't** skip the scope check — `gh issue create` works with just `repo`,
  but `gh project ...` will fail without `project` scopes.
- **Don't** hardcode any assumption about which sandbox `gh` runs in — for
  keyring-backed tokens, request full permissions.
