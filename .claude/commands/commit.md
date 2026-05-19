Create a git commit (and optionally a PR) using EduHub's conventional commit
format. Use `/commit` to commit staged changes, `/commit --pr` to also open a
pull request afterward.

## Source of truth

Format rules live in `.cursor/rules/conventional-commits.mdc`.
When in doubt about release impact, check `frontend-nx/.releaserc.json`.

## Step 1 — gather context

Run these in parallel:

```bash
git diff --cached          # what is staged
git diff                   # what is unstaged (for awareness)
git log --oneline -10      # recent commit style reference
git status --short
```

If nothing is staged, tell the user and stop.

## Step 2 — draft the subject line

Apply the format exactly:

```
<type>[optional scope]: <description>
```

Rules:
- Type from this list: `feat` `fix` `perf` `docs` `style` `refactor` `test`
  `build` `ci` `chore`
- Scope from this list (omit when it adds no clarity): `sessions` `attendance`
  `i18n` `edu-hub` `functions` `zoom` `tablegrid` `auth` `backend` `frontend`
  `db` `infra` `deps` `release` `cursor` `projects` `migrations`
- Description: imperative mood, no trailing period, no capital first letter
- Subject line **must be ≤ 72 characters**
- Append `!` after the scope/type for breaking changes

## Step 3 — decide whether to add a body

Add a body for any non-trivial change, especially:
- Bug fixes with a real failure mode
- Schema, permissions, or GraphQL changes
- Auth or security-sensitive changes
- Release, migration, or operational changes
- Features with behavioural nuance

Body format:
- One blank line after the subject
- Wrap every line at **80 characters**
- Cover in order: what was broken/missing → why → what changed → side effects
- Never restate the subject line

## Step 4 — breaking change footer (only if needed)

Only add `BREAKING CHANGE:` when an existing user, integrator, or operator
must change code/config/expectations to keep working. Internal refactors,
CI changes, and dev-tooling changes are never breaking.

```
BREAKING CHANGE: <one-line summary>

<detail if needed, wrapped at 80 chars>
```

## Step 5 — commit

Create the commit using a heredoc so formatting is preserved exactly:

```bash
git commit -m "$(cat <<'EOF'
<subject>

<body if any>

<footer if any>
EOF
)"
```

Verify success with `git log --oneline -1`.

## Step 6 — PR (only when `--pr` flag is given)

After a successful commit and push, create a PR with:

```
gh pr create \
  --title "<short descriptive title — NO type prefix, just plain English>" \
  --body "$(cat <<'EOF'
## Summary

- <bullet 1>
- <bullet 2>

## Release impact

<type> → <MAJOR / MINOR / PATCH / none> version bump on merge to production.

## Test plan

- [ ] <manual check 1>
- [ ] <manual check 2>
EOF
)"
```

PR title conventions in this repo (derived from branch-name style):
- Plain English, no `feat:` / `fix:` prefix — that belongs in commit messages
- ≤ 72 characters, sentence case, no trailing period
- Examples: "Add OAuth2 integration with Keycloak",
  "Fix table pagination on manage courses page",
  "Refactor project schema step 1"

## Output style

After committing, print:
1. The full commit message as committed.
2. One line noting the release impact (e.g. "patch bump on next production
   release" or "no version bump").

Keep the output tight — do not narrate every git command.
