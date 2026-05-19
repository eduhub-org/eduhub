Guide branch promotions and reason about release impact in EduHub.

## Source of truth

When prose docs disagree, trust the configuration:

- `frontend-nx/.releaserc.json` — semantic-release setup
- `.github/workflows/release.yml` — when and how it runs

Current behavior: semantic-release runs **only** on pushes to `production`.
`develop` and `staging` are operational branches but do not publish releases
by themselves.

## Branch model

```
feature/*  →  develop  →  staging  →  production
                                    ↑ semantic-release fires here
```

- `develop`: integration. Feature branches merge here. Deploys to dev env.
- `staging`: release candidate. PRs from `develop`. Deploys to staging env.
- `production`: release. PRs from `staging`. Deploys to prod and publishes a
  semantic version.

Never manually edit `frontend-nx/package.json`, root `package.json`,
`functions/*/package.json`, or `CHANGELOG.md` — semantic-release synchronizes
them.

## Promote develop → staging

```bash
git checkout staging
git pull origin staging
git merge develop
git push origin staging
```

Use a conventional merge subject (not GitHub's default):

```
chore: merge develop into staging for release candidate
```

## Promote staging → production

```bash
git checkout production
git pull origin production
git merge staging
git push origin production
```

```
chore: promote staging to production release
```

Semantic-release then:
1. Reads all conventional commits since the last tag.
2. Picks MAJOR / MINOR / PATCH from commit types
   (see `/conventional-commits` for the table).
3. Bumps `frontend-nx/package.json`, root `package.json`, every
   `functions/*/package.json`.
4. Updates `CHANGELOG.md`.
5. Creates a git tag and GitHub release.

Semantic-release adds `[skip ci]` to release commits automatically.

## Sync tags back

After production releases, fast-forward the version tags into the upstream
branches so future diffs stay clean:

```bash
git checkout develop && git merge production && git push origin develop
git checkout staging && git merge production && git push origin staging
```

## Squash merges

If you squash a release PR and the squash commit must carry the version-bump
meaning, use the lowest truthful type:

```
fix(release): prepare staging release candidate from develop
feat(release): prepare staging release candidate from develop
feat(release)!: prepare staging release candidate from develop
```

Use `chore:` for the merge commit when the underlying feature/fix commits
already describe the user-facing changes.

## After a release

Write a user-facing summary with `/version-update-summaries` for Slack /
release notes. If a hotfix was applied directly to `production`, backport it
with `/cherrypick-hotfix`.

## Output style

When asked how to promote a release, return:
1. The branch path to use.
2. The recommended PR or merge commit title.
3. The expected release-impact note.
4. Any warning where docs and configuration disagree.
