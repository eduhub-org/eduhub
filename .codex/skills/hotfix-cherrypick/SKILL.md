---
name: hotfix-cherrypick
description: Backport EduHub production hotfixes into develop and optionally staging. Use when a fix landed directly on production and must be cherry-picked into the normal promotion branches.
---
# Hotfix Cherry-Pick

Use this skill when a production hotfix needs to be backported.

## Default Flow

1. identify commits present in `production` but missing from `develop`
2. cherry-pick them onto `develop`
3. verify the commit is now contained in `develop`

Useful command:

```bash
git log --oneline develop..production
```

## Standard Cherry-Pick Flow

```bash
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
git push origin develop
```

Verify:

```bash
git branch --contains <commit-hash>
```

## When To Also Pick To Staging

Also backport to `staging` when:

- the user explicitly asks for it
- the fix is urgent and needed before the next normal promotion from `develop`
- release timing means waiting for the next promotion would be risky

## Conflict Handling

If cherry-pick conflicts:

- resolve the files intentionally
- continue with `git cherry-pick --continue`
- abort with `git cherry-pick --abort` if the pick was wrong or needs to be retried differently

## Output Style For This Skill

When helping with a hotfix backport, tell the user:

1. which commit(s) were missing
2. whether you are targeting only `develop` or both `develop` and `staging`
3. whether conflicts occurred
