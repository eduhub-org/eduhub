---
name: cherrypick-hotfix
description: Cherry-pick hotfix commits from production to develop. Use when a hotfix was pushed directly to production and needs to be backported to develop branch.
---
# Cherry-pick Hotfix to Develop

## When to Use

- A hotfix was pushed directly to production
- The fix is missing from develop (and possibly staging)
- You need to ensure the fix is included in future releases

## Quick Steps

### 1. Identify the missing commits

```bash
# Show commits in production that are NOT in develop
git log --oneline develop..production
```

### 2. Cherry-pick to develop

```bash
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
git push origin develop
```

### 3. Verify

```bash
# Confirm the commit is now in develop
git branch --contains <commit-hash>
```

## Optional: Also add to staging immediately

**When to cherry-pick to staging:**
- User explicitly asks to also add to staging
- User mentions the fix is urgent or needed in staging
- Context suggests staging needs the fix before the next develop merge

**Default behavior:** Only cherry-pick to develop unless user requests staging or context indicates it's needed.

**If uncertain:** Ask the user: "Should I also cherry-pick this to staging, or is develop sufficient?"

**If staging is needed:**

```bash
git checkout staging
git pull origin staging
git cherry-pick <commit-hash>
git push origin staging
```

## Troubleshooting

### Cherry-pick conflict
If there are conflicts during cherry-pick:
```bash
# Resolve conflicts in the files
# Then continue
git add .
git cherry-pick --continue
```

### Wrong commit cherry-picked
```bash
# Abort before completing
git cherry-pick --abort
```

### Multiple hotfix commits
Cherry-pick in chronological order (oldest first):
```bash
git cherry-pick <older-commit> <newer-commit>
```
