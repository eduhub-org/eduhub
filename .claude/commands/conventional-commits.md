Draft a conventional commit message for an EduHub change.

## Source of truth

When prose docs disagree with the actual release configuration, prefer:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

Today, semantic-release publishes only on pushes to `production`.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- **Every line under 80 characters** (subject, body lines, footers, bullets).
- Subject: imperative mood, no trailing period (`add feature`, not
  `added feature.`).
- Body: leave one blank line after the subject; wrap manually at 80 chars.

## Types and release impact

| Type | Bump | Use for |
|------|------|---------|
| `feat` | minor | New user- or operator-visible capability |
| `fix` | patch | Correcting broken behavior |
| `perf` | patch | Measurable performance improvement |
| `docs` | none | Documentation only |
| `style` | none | Formatting / whitespace |
| `refactor` | none | Internal restructure, no behavior change |
| `test` | none | Adding or fixing tests |
| `build` | none | Build system, packaging, dependencies |
| `ci` | none | CI/CD pipeline |
| `chore` | none | Maintenance, release plumbing, dependency bumps |
| `BREAKING CHANGE:` / `!` | major | Existing user/operator must change behavior |

Don't mark something breaking unless an existing user, integrator, or
operator must change code/config/expectations to keep working.

## Common scopes in this repo

`sessions`, `attendance`, `i18n`, `edu-hub`, `functions`, `zoom`,
`tablegrid`, `auth`, `backend`, `frontend`, `db`, `infra`, `deps`, `release`,
`cursor`, `projects`, `migrations`. Drop the scope when it wouldn't add clarity.

## When to add a body

Add a body for any non-trivial commit, especially:

- bug fixes with a real failure mode
- schema, permissions, or GraphQL changes
- auth or security-sensitive changes
- release, migration, or operational changes
- features with behavioral nuance

A good body usually covers, in this order:

1. What was broken or missing.
2. Why it happened.
3. What changed.
4. Side effects, regenerations, follow-ups, compatibility notes.

Avoid restating the title.

## Merge commits

Repo history mixes conventional and default GitHub merges. When you control
the merge message, use a conventional one:

```
chore: merge develop into staging for release candidate
chore: promote staging to production release
```

For a squash-merge that needs to carry release impact, use the lowest truthful
type — `fix(release): ...`, `feat(release): ...`, `feat(release)!: ...`.

## Examples

Small fix without body:

```
fix(i18n): add missing coursePage.remove_external_speaker translation
```

Bug fix with body:

```
fix(sessions): protect AttendanceRow synthetic id from data overwrite

parseAttendanceData seeded each row with a synthetic id and then copied
every key from the imported dataset, which allowed a nullable source id
column to overwrite the row identifier used by TableGrid.

Skip imported id and _idx keys when building the row object so the
synthetic identifier remains stable and the attendance review dialog no
longer crashes on datasets that include their own id column.
```

Coordinated feature commit:

```
feat(attendance): aggregate Zoom attendance across session-scoped instances

Attendance processing previously relied on Zoom's last-call semantics,
which could attach participants to the wrong session after reconnects or
late link clicks.

Fetch past meeting instances within the session window, aggregate rows by
participant across instances, record the match strategy, and keep the
legacy fallback only for meetings where Zoom reports no instances.
```

Breaking change footer:

```
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: clients on /v1/* must migrate to /v2/*. See the
migration guide in docs/api/v2-migration.md.
```

## Output style for this skill

Return:
1. The proposed subject line.
2. An optional body when the change is non-trivial.
3. A one-line note on release impact when relevant.

Verify every line is under 80 characters before finalizing.
