---
name: conventional-commits
description: Draft and review EduHub commit messages using the
  repository's conventional-commit and semantic-release workflow.
  Use when writing commit messages, choosing feat vs fix vs chore,
  deciding whether a body is needed, preparing merge commit messages,
  or explaining release impact.
---
# Conventional Commits

Use this skill when the task involves commit messages, release impact,
or merge-message wording for EduHub.

## Goals

- Produce a conventional-commit subject line that matches the actual change.
- Add a useful body for non-trivial changes.
- Keep every commit-message line under 80 characters.
- Avoid merge messages that hide release intent.
- Keep guidance aligned with the repo's real semantic-release configuration.

## Source Of Truth

When commit or release guidance conflicts, prefer the actual release
configuration over stale prose docs:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

For this repo, semantic-release currently runs only on pushes to `production`.

## Subject Format

Use:

```text
<type>[optional scope]: <description>
```

Length rule:

- every line in the commit message must be fewer than 80 characters
- this includes the subject, body paragraphs, bullets, and footers
- wrap body text manually instead of leaving long prose on one line
- before returning or running `git commit`, re-check every line
- if any line is 80 characters or longer, rewrite until all lines are <80

Examples:

```text
feat(sessions): add AttendanceData review dialog
fix(i18n): add missing remove_external_speaker translation
chore(deps): bump dompurify in frontend-nx
docs(cursor): document Karpathy behavioral guidelines
```

## Allowed Types

Use these commit types:

- `feat`: user-visible feature or capability
- `fix`: bug fix or correctness fix
- `docs`: documentation-only change
- `style`: formatting or presentation-only change
- `refactor`: internal restructuring without behavior change
- `perf`: measurable performance improvement
- `test`: add or update tests
- `build`: build tooling, packaging, dependency/build-system wiring
- `ci`: CI/CD workflow changes
- `chore`: maintenance or repo housekeeping that is not better
  described by another type

## Common Scopes

Prefer an existing product or subsystem term when it makes the subject clearer.

Common scopes seen in this repo include:

- `sessions`
- `attendance`
- `i18n`
- `edu-hub`
- `functions`
- `zoom`
- `tablegrid`
- `auth`
- `backend`
- `frontend`
- `db`
- `infra`
- `deps`
- `release`
- `cursor`

Do not force a scope if the message is clearer without one.

## How To Choose The Type

- Use `feat` when behavior is added, exposed, or expanded for users
  or operators.
- Use `fix` when correcting broken behavior, invalid data flow,
  crashes, bad queries, wrong permissions, or misleading UI
  behavior.
- Use `refactor` only when behavior is intentionally unchanged.
- Use `chore` for generated type updates, dependency bumps, cleanup,
  or release plumbing unless another type is more accurate.
- Use `docs` for docs-only changes, including repo instructions and
  agent guidance.

If the diff includes both feature work and follow-up cleanup,
classify by the primary user-facing outcome.

## Release Impact

For EduHub semantic-release:

- `feat` -> minor release
- `fix` -> patch release
- `perf` -> patch release
- `BREAKING CHANGE` or `!` -> major release
- `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore` ->
  no version bump by themselves

Do not mark a change as breaking unless an existing user,
integrator, or operator must change behavior, code, config, or
expectations to keep working.

## Commit Bodies

In this repository, many strong commits include a body, and the skill
should preserve that pattern.

Add a body when the change is not trivial, especially for:

- bug fixes with a real failure mode
- features with behavioral nuance
- schema, permissions, or GraphQL changes
- auth or security-sensitive changes
- release, migration, or operational changes
- fixes where the title alone would not explain the risk

For non-trivial commits, the body should usually cover:

1. What was broken, risky, or missing.
2. Why it happened.
3. What changed to fix it.
4. Important side effects, follow-up regeneration, retries, tests,
   or compatibility notes.

Good body styles in this repo include:

- one short explanatory paragraph plus one short fix paragraph
- a compact bullet list for several coordinated changes
- numbered sections when describing multiple related bugs in one fix
- wrapped prose with each line kept under 80 characters

If a body is present:

- leave exactly one blank line between the subject and the body
- keep every body line under 80 characters
- wrap explanatory paragraphs rather than using one long line

Avoid filler. The body should add debugging or review value, not
restate the title.

### When Running `git commit`

When applying a commit message through the CLI:

- for a subject-only commit, `git commit -m "subject"` is fine
- for any commit with a body, prefer writing the full message to a
  temporary file and running `git commit -F <file>`
- use `git commit -F` whenever the body needs manual line wrapping,
  multiple paragraphs, bullets, or footers
- do not use multiple body `-m` flags just to wrap lines; each extra
  `-m` creates a separate paragraph with a blank line
- avoid shell-embedded newline tricks such as `$'...\n...'` for commit
  bodies; they are easy to quote incorrectly and hard to review
- before committing, inspect the message file and verify paragraph
  breaks and line lengths directly

Preferred workflow for a commit with a body:

1. Create a temporary message file, for example under `/tmp` or
   `/private/tmp`.
2. Put the complete subject, blank lines, body paragraphs, bullets, and
   footers in that file exactly as they should appear in Git history.
3. Check that every line is <80 characters.
4. Run `git commit -F <message-file>`.
5. Verify with `git log -1 --format=full`.

Example message file:

```text
fix(functions): restore python_functions dev startup

The dev python_functions container installs both Python requirement files
into one shared environment. Installing callPythonFunction first let
apiProxy downgrade cryptography below the version required by pyHanko,
causing xhtml2pdf imports to crash on startup.

Install apiProxy requirements first in Docker Compose so the final
shared dev environment satisfies callPythonFunction's PDF dependencies.
Production Cloud Functions keep their separate requirement files
unchanged.
```

Example command:

```bash
git commit -F /private/tmp/eduhub-commit-message.txt
```

Commit message preflight:

1. Subject uses conventional-commit format.
2. Every line is <80 characters.
3. Extra blank lines appear only between intentionally separate
   paragraphs or footers.
4. If the message has a body, it is committed with `git commit -F`.

## Footers

Use footers for formal metadata:

- `BREAKING CHANGE: ...`
- `Co-authored-by: ...`
- other standard trailers when needed

Keep footer lines under 80 characters too.

Do not put ordinary explanation into footers.

## Merge Commits

Repo history currently diverges from the written ideal:

- many individual commits already use conventional subjects
- many merge commits still use GitHub's default
  `Merge pull request #...` subject

When you are asked to draft or perform a merge commit, prefer an
explicit conventional message instead of the GitHub default.

Recommended merge subjects:

```text
chore: merge develop into staging for release candidate
chore: promote staging to production release
fix(release): prepare staging release candidate from develop
feat(release): promote staging to production
```

Use `chore` for pure branch-promotion merge commits when the
underlying feature/fix commits already describe the real changes.

## Output Style For This Skill

When the user asks for a commit message, return:

1. the proposed subject line
2. an optional body if the change is non-trivial
3. a one-line note on release impact when relevant

Before finalizing a commit message, check that every line is under 80
characters. This is mandatory.

When the diff is ambiguous, explain the tradeoff briefly, then
recommend one message.

When executing `git commit`, use separate `-m` flags only for intentional
paragraph or footer breaks. Do not use extra `-m` flags for line wrapping,
and do not use literal `\n` sequences instead of embedded newlines.

## Examples

### Small fix without body

```text
fix(i18n): add missing coursePage.remove_external_speaker translation
```

### Bug fix with body

```text
fix(sessions): protect AttendanceRow synthetic id from data overwrite

parseAttendanceData seeded each row with a synthetic id and then copied
every key from the imported dataset, which allowed a nullable source id
column to overwrite the row identifier used by TableGrid.

Skip imported id and _idx keys when building the row object so the
synthetic identifier remains stable and the attendance review dialog no
longer crashes on datasets that include their own id column.
```

### Coordinated feature commit

```text
feat(attendance): aggregate Zoom attendance across session-scoped instances

Attendance processing previously relied on Zoom's last-call semantics,
which could attach participants to the wrong session after reconnects or
late link clicks.

Fetch past meeting instances within the session window, aggregate rows by
participant across instances, record the match strategy, and keep the
legacy fallback only for meetings where Zoom reports no instances.
```

## See Also

Read `references/release-config.md` when you need the exact
repo-specific release behavior behind this skill.
