Backport a hotfix commit from `production` into `develop` (and optionally
`staging`).

## When to use

A critical fix landed directly on `production` (or `staging`) and must be
brought back into the normal promotion flow so it isn't lost on the next
`develop → staging → production` cycle.

## Identify the commit(s)

```bash
git log --oneline develop..production
```

Cherry-pick the actual fix commit(s); skip merge commits.

## Backport to develop

```bash
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
# resolve conflicts if any, then:
git cherry-pick --continue       # or --abort to retry differently
git push origin develop
```

Verify:

```bash
git branch --contains <commit-hash>
```

## Also backport to staging when

- The user explicitly asks for it.
- The next promotion cycle is too far away (e.g. release imminent).
- Waiting would leave the staging environment broken.

```bash
git checkout staging
git pull origin staging
git cherry-pick <commit-hash>
git push origin staging
```

## Conflict handling

- Resolve the conflict deliberately; don't blindly accept either side.
- `git cherry-pick --continue` after staging the resolution.
- `git cherry-pick --abort` to bail out cleanly if the pick was wrong.

## Commit messages

Keep the original conventional commit subject. If the cherry-pick creates a
new message, retain the original type/scope and add a trailer noting the
source:

```
fix(auth): prevent session token from expiring before refresh window

Cherry-picked from production commit abc1234.
```

## After backporting

- Confirm CI passes on the target branches.
- If the fix included a migration, verify the migration directory is now
  present in `develop`'s history too.
- Flag any change to shared infra so other contributors don't re-apply it.

## Output style

When helping with a hotfix backport, state:
1. Which commit(s) were missing from `develop` (and `staging`, if applicable).
2. Which branches you targeted.
3. Whether any conflicts occurred and how they were resolved.
