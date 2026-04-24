---
name: release-workflow
description: Guide EduHub release preparation and branch-promotion work. Use when preparing release PRs, promoting changes across develop, staging, and production, drafting merge commit messages for release branches, or explaining how semantic-release behaves in this repository.
---
# Release Workflow

Use this skill for EduHub branch-promotion and release work.

## Source Of Truth

Prefer the actual release configuration over prose docs:

- `frontend-nx/.releaserc.json`
- `.github/workflows/release.yml`

Current reality:

- semantic-release runs only for `production`
- `develop` and `staging` still matter operationally, but they do not publish releases by themselves

Read `references/semantic-release.md` when you need exact repo behavior.

## Branch Flow

Use this branch flow unless the user says otherwise:

1. Feature branches merge into `develop`
2. `develop` is promoted to `staging` for release-candidate testing
3. `staging` is promoted to `production` for the actual release

## When To Use Which Commit Message

For ordinary feature work, individual commits should describe the real change and usually use `feat`, `fix`, `perf`, and so on.

For branch-promotion merges:

- prefer an explicit conventional merge message
- avoid GitHub's default `Merge pull request #...` message when preparing a merge manually or when the user asks you to draft one

Recommended branch-promotion subjects:

```text
chore: merge develop into staging for release candidate
chore: promote staging to production release
```

If the user is squashing and needs the squash commit itself to carry release intent, use one of:

```text
fix(release): prepare staging release candidate from develop
feat(release): prepare staging release candidate from develop
feat(release)!: prepare staging release candidate from develop
```

Use the lowest truthful release-impact type.

## Practical Guidance

- Treat `production` as the only branch that publishes a semantic-release version.
- Keep individual feature/fix commits descriptive so the final release notes remain useful.
- Use `chore` for pure branch promotion when the underlying commits already describe the user-facing changes.
- Use `feat`/`fix`/`feat!` on a squash merge only when that single merge commit must carry the version-bump meaning.

## Output Style For This Skill

When the user asks how to promote a release, answer with:

1. the branch path to use
2. the recommended PR or merge commit title
3. any release-impact note that matters
4. any repo-specific warning if docs and config differ

## See Also

- `../conventional-commits/SKILL.md`
- `references/semantic-release.md`
