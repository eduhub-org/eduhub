---
name: create-project-issue
description: Create a GitHub issue on eduhub-org/eduhub and add it to the "EduHub Development" project board with a chosen Status (Backlog / Todo / In Progress / Done). Use when the user asks to "create an issue", "file a ticket", "add to backlog", or otherwise wants a new issue tracked on the project board.
---
# Create a Project-Board Issue on eduhub-org/eduhub

## Target

- **Repo**: `eduhub-org/eduhub`
- **Project**: "EduHub Development" (number `4`, ID `PVT_kwDOBMmEKM4ANN95`)

## Authentication prerequisites

The `gh` CLI must be logged in with these scopes: `repo`, `project`, `read:project` (plus the default `gist`, `read:org`, `workflow`).

Check first:

```bash
gh auth status
```

### Common auth issues

- **"token is invalid" in the sandbox but works in a real terminal**: the token is stored in the OS keyring (`Logged in to github.com account ... (keyring)`), which the Shell sandbox cannot reach. Re-run the command with `required_permissions: ["all"]` (bypass sandbox).
- **"missing required scopes [read:project]" / [project]"**: ask the user to run `gh auth refresh -s project,read:project` in their own terminal, then retry.

## Workflow

### 1. Write the issue body to a temp file

Use `gh issue create --body-file` (NOT `--body`) so multi-line markdown with backticks renders correctly.

```bash
# Use the Write tool to create /tmp/<short_name>.md with the issue body.
```

### 2. Create the issue

```bash
gh issue create \
  --repo eduhub-org/eduhub \
  --title "<concise title>" \
  --body-file /tmp/<short_name>.md
```

The command prints the issue URL on success. Parse the trailing integer for the issue number.

### 3. Add the issue to the project board

```bash
gh project item-add 4 \
  --owner eduhub-org \
  --url <issue_url> \
  --format json
```

Capture the `id` field from the JSON output — that's the **item ID** (looks like `PVTI_lADOBMmEKM4ANN95zg...`). You need it to set status.

### 4. Set the Status field

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

Default to **Backlog** unless the user specifies otherwise.

### 5. Report back

Report the issue URL and confirm it's on the project board with the chosen status.

## Multiple related issues

If you create more than one related issue (e.g., a parent issue and a follow-up):

1. Create issue 1, capture its number.
2. Substitute `#<issue_1_number>` into issue 2's body BEFORE creating it (so cross-references render).
3. After issue 2 is created, optionally `gh issue edit <issue_1_number> --body-file ...` to add a back-link from issue 1 to issue 2.

## Refreshing stale IDs

The Project number `4`, project ID, Status field ID, and option IDs above are stable for the current project. If you suspect they've changed (e.g., a renamed status column), refresh with:

```bash
gh project list --owner eduhub-org
gh project field-list 4 --owner eduhub-org --format json
```

## Body file structure (recommended)

Match the conventions used by recent issues — keep markdown rich and link to specific files with line numbers where useful:

```markdown
### Summary
[Problem + proposed solution in 2-4 paragraphs.]

### Background / current state
[Bullet points with concrete file links like
`[CalendarContent/index.tsx](frontend-nx/apps/edu-hub/components/pages/CalendarContent/index.tsx) line 118`.]

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

## End-to-end example (one issue → Backlog)

```bash
gh auth status

cat > /tmp/my_issue.md <<'EOF'
### Summary
Short description...

### Acceptance criteria
- [ ] ...
EOF

# Create
gh issue create --repo eduhub-org/eduhub \
  --title "My new feature" \
  --body-file /tmp/my_issue.md
# → https://github.com/eduhub-org/eduhub/issues/1700

# Add to project, capture item ID
gh project item-add 4 --owner eduhub-org \
  --url https://github.com/eduhub-org/eduhub/issues/1700 \
  --format json | jq -r .id
# → PVTI_lADOBMmEKM4ANN95zg...

# Set Status = Backlog
gh project item-edit \
  --project-id PVT_kwDOBMmEKM4ANN95 \
  --id PVTI_lADOBMmEKM4ANN95zg... \
  --field-id PVTSSF_lADOBMmEKM4ANN95zgIb1OI \
  --single-select-option-id 72a55bef
```

## Anti-patterns

- Do NOT use `gh issue create --body "..."` with inline multi-line text — quoting breaks easily on backticks and code fences. Always use `--body-file`.
- Do NOT skip the project scope check — `gh issue create` works with just `repo`, but `gh project ...` fails silently / with permission errors.
- Do NOT hardcode the legacy assumption that `gh` runs in the default Shell sandbox — for keyring-backed tokens, request `["all"]` permissions.
