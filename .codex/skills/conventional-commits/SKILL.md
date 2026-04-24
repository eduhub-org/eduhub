---
name: conventional-commits
description: Draft and review EduHub commit messages using the repository's conventional-commit and semantic-release workflow. Use when writing commit messages, choosing feat vs fix vs chore, deciding whether a body is needed, preparing merge commit messages, or explaining release impact.
---
# Conventional Commits

Use this skill when the task involves commit messages, release impact, or merge-message wording for EduHub.

## Goals

- Produce a conventional-commit subject line that matches the actual change.
- Add a useful body for non-trivial changes.
- Avoid merge messages that hide release intent.
- Keep guidance aligned with the repo's real semantic-release configuration.

## Source Of Truth

When commit or release guidance conflicts, prefer the actual release configuration over stale prose docs:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

For this repo, semantic-release currently runs only on pushes to `production`.

## Subject Format

Use:

```text
<type>[optional scope]: <description>
```

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
- `chore`: maintenance or repo housekeeping that is not better described by another type

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

- Use `feat` when behavior is added, exposed, or expanded for users or operators.
- Use `fix` when correcting broken behavior, invalid data flow, crashes, bad queries, wrong permissions, or misleading UI behavior.
- Use `refactor` only when behavior is intentionally unchanged.
- Use `chore` for generated type updates, dependency bumps, cleanup, or release plumbing unless another type is more accurate.
- Use `docs` for docs-only changes, including repo instructions and agent guidance.

If the diff includes both feature work and follow-up cleanup, classify by the primary user-facing outcome.

## Release Impact

For EduHub semantic-release:

- `feat` -> minor release
- `fix` -> patch release
- `perf` -> patch release
- `BREAKING CHANGE` or `!` -> major release
- `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore` -> no version bump by themselves

Do not mark a change as breaking unless an existing user, integrator, or operator must change behavior, code, config, or expectations to keep working.

## Commit Bodies

In this repository, many strong commits include a body, and the skill should preserve that pattern.

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
4. Important side effects, follow-up regeneration, retries, tests, or compatibility notes.

Good body styles in this repo include:

- one short explanatory paragraph plus one short fix paragraph
- a compact bullet list for several coordinated changes
- numbered sections when describing multiple related bugs in one fix

Avoid filler. The body should add debugging or review value, not restate the title.

## Footers

Use footers for formal metadata:

- `BREAKING CHANGE: ...`
- `Co-authored-by: ...`
- other standard trailers when needed

Do not put ordinary explanation into footers.

## Merge Commits

Repo history currently diverges from the written ideal:

- many individual commits already use conventional subjects
- many merge commits still use GitHub's default `Merge pull request #...` subject

When you are asked to draft or perform a merge commit, prefer an explicit conventional message instead of the GitHub default.

Recommended merge subjects:

```text
chore: merge develop into staging for release candidate
chore: promote staging to production release
fix(release): prepare staging release candidate from develop
feat(release): promote staging to production
```

Use `chore` for pure branch-promotion merge commits when the underlying feature/fix commits already describe the real changes.

## Output Style For This Skill

When the user asks for a commit message, return:

1. the proposed subject line
2. an optional body if the change is non-trivial
3. a one-line note on release impact when relevant

When the diff is ambiguous, explain the tradeoff briefly, then recommend one message.

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

Read `references/release-config.md` when you need the exact repo-specific release behavior behind this skill.
