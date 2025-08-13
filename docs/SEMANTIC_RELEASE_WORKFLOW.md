# Semantic Release Workflow Guide

This document describes the proper process for creating Pull Requests (PRs) and merging into `staging` and `production` branches to ensure semantic-release works correctly.

## Overview

Our repository uses semantic-release for automated versioning and releases. The branching strategy is:
- `develop` - Main development branch
- `staging` - Pre-release testing branch (triggers pre-release versions)
- `production` - Production release branch (triggers stable releases)

## Branch Configuration

Current semantic-release configuration:
```json
{
  "branches": [
    {
      "name": "production",
      "channel": "latest"
    },
    {
      "name": "staging", 
      "prerelease": "rc",
      "channel": "staging"
    },
    {
      "name": "develop",
      "prerelease": "dev", 
      "channel": "develop"
    }
  ]
}
```

## Conventional Commit Format

All commits that should trigger releases must follow conventional commit format:

### Format
```
type(scope): description

[optional body]

[optional footer]
```

### Release Types

#### Version Bumping Types
- `feat:` - New feature (triggers **minor** version bump)
- `fix:` - Bug fix (triggers **patch** version bump)
- `perf:` - Performance improvement (triggers **patch** version bump)
- `BREAKING CHANGE:` - Breaking change (triggers **major** version bump)

#### Non-Version Bumping Types (appear in changelog)
- `chore:` - Maintenance tasks (no release, appears in changelog)
- `docs:` - Documentation changes (no release, appears in changelog)
- `style:` - Code style changes (no release, appears in changelog)
- `refactor:` - Code refactoring (no release, appears in changelog)
- `test:` - Adding tests (no release, appears in changelog)
- `build:` - Build system changes (no release, appears in changelog)
- `ci:` - CI configuration changes (no release, appears in changelog)

### Examples
```bash
feat: add user authentication system
fix: resolve navigation menu bug
feat!: redesign user dashboard (breaking change)
chore: update dependencies to latest versions
```

## Workflow Process

### 1. Feature Development

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication

# Make changes and commit with conventional format
git add .
git commit -m "feat: add user authentication system"
git push origin feature/user-authentication

# Create PR to develop
gh pr create --base develop --head feature/user-authentication \
  --title "feat: add user authentication system"
```

### 2. Merging to Develop

```bash
# Via GitHub UI or locally
git checkout develop
git pull origin develop
git merge feature/user-authentication -m "feat: add user authentication system"
git push origin develop
```

**Note:** Merging to `develop` will trigger a dev pre-release (e.g., `1.2.3-dev.1`)

### 3. Creating PR from Develop to Staging

```bash
# Create PR from develop to staging
gh pr create --base staging --head develop \
  --title "chore: prepare staging release from develop"
```

### 4. Merging to Staging ⚠️ **CRITICAL**

This merge **MUST** use a conventional commit message to trigger semantic-release:

#### Option A: Merge with Conventional Message (Recommended)
```bash
git checkout staging
git pull origin staging
git merge develop -m "chore: merge develop into staging for release candidate"
git push origin staging
```

#### Option B: Squash Merge
If you squash, the PR's individual commit types are lost. The single squash commit message determines the release bump.

Use a message that reflects the aggregate changes:

```bash
git checkout staging
git pull origin staging
git merge --squash develop

# Choose ONE of the following based on the changes included
# Only fixes included → patch
git commit -m "fix(release): prepare staging release candidate from develop"

# Features included (or you want at least a minor) → minor
# git commit -m "feat(release): prepare staging release candidate from develop"

# Breaking change included → major
# git commit -m "feat(release)!: prepare staging release candidate from develop" -m "BREAKING CHANGE: describe the breaking change"

git push origin staging
```

Notes:
- Prefer "Create a merge commit" to preserve individual commit history so semantic-release can infer the correct bump automatically.
- Only use `feat(release)` for squash merges when you intentionally want a minor bump regardless of underlying commits.

#### Option C: Via GitHub UI
When merging the PR in GitHub:
1. Choose "Squash and merge" or "Create a merge commit"
2. **Edit the commit message** to follow conventional format:
   ```
   chore: merge develop into staging for release candidate
   ```

**❌ DO NOT use GitHub's default merge message:**
```
Merge pull request #1359 from eduhub-org/develop
Develop
```

**✅ USE conventional commit format:**
```
# Preserve history (merge commit)
chore: merge develop into staging for release candidate

# Squash merge examples (pick one based on content)
fix(release): prepare staging release candidate from develop
feat(release): prepare staging release candidate from develop
feat(release)!: prepare staging release candidate from develop

BREAKING CHANGE: describe the breaking change
```

**Result:** Merging to `staging` will trigger a release candidate (e.g., `1.3.0-rc.1`)

### 5. Creating PR from Staging to Production

```bash
# Create PR from staging to production
gh pr create --base production --head staging \
  --title "chore: release version 1.3.0 to production"
```

### 6. Merging to Production

```bash
git checkout production
git pull origin production

# Preserve history (recommended)
git merge staging -m "chore: promote staging to production release"

# If you must squash, select a message matching the intended bump:
# git merge --squash staging
# git commit -m "fix(release): promote staging to production"
# git commit -m "feat(release): promote staging to production"
# git commit -m "feat(release)!: promote staging to production" -m "BREAKING CHANGE: describe the breaking change"

git push origin production
```

**Result:** Merging to `production` will trigger a stable release (e.g., `1.3.0`)

## Troubleshooting

### "The commit should not trigger a release"

This error occurs when:
- Merge commit doesn't follow conventional commit format
- No commits in the merge follow conventional commit format

**Solution:** Ensure merge commits use conventional format:
```bash
# Instead of default merge message
git merge develop

# Use conventional commit message
git merge develop -m "feat: merge develop branch with latest features"
```

### No Release Triggered

Check that:
1. Merge commit follows conventional commit format
2. At least one commit in the merge contains `feat:`, `fix:`, or other release-triggering types
3. Commits are not marked with `[skip ci]` or `[skip release]`

### Release Types Not Working

Verify your commit messages match exactly:
- `feat:` (not `feature:` or `Feature:`)
- `fix:` (not `bugfix:` or `Fix:`)
- Include colon `:` after type
- Use lowercase for type

## Monorepo Configuration

- Semantic-release runs from the `frontend-nx` directory
- Automatically syncs versions across all workspace packages  
- Updates root `package.json` and all `functions/*/package.json` files
- GitHub Actions workflow handles the entire release process
- No manual intervention required once PRs are merged

## Best Practices

1. **Always use conventional commit messages** for merge commits into `staging` and `production`
2. **Test thoroughly** before merging to `staging`
3. **Review release notes** generated by semantic-release
4. **Use descriptive commit messages** that explain what features/fixes are included
5. **Coordinate with team** before production releases
6. **Monitor CI/CD pipeline** after each merge to ensure successful release
7. **Remember**: Semantic-release analyzes all commits in a merge, not just the merge commit message

## Example Commit Messages for Merges

### Good Examples
```bash
chore: merge develop into staging for release candidate
chore: merge develop into production for stable release
chore: prepare staging release from develop branch
chore: promote staging to production release
```

### Bad Examples
```bash
Merge pull request #123 from org/develop          # Default GitHub message
merge develop                                      # No conventional format  
Update from develop                                # No type specified
feat merge develop                                 # Missing colon
```

## Semantic Versioning Logic

### Where Version Bumps Come From

**Individual commits in develop determine the version bump:**
- If develop contains `feat:` commits → **minor** version bump (1.2.0 → 1.3.0)
- If develop contains only `fix:` commits → **patch** version bump (1.2.0 → 1.2.1)  
- If develop contains `BREAKING CHANGE:` → **major** version bump (1.2.0 → 2.0.0)

**Important**: When merging to staging/production, semantic-release analyzes **ALL commits** being merged to determine the version bump, not just the merge commit message.

**Merge commits use `chore:` because:**
- The merge itself is a maintenance/deployment task
- The actual features/fixes are already documented in individual commits
- This prevents double-counting version bumps
- It keeps the git history clean and semantic
- `chore:` commits appear in the changelog but don't trigger version bumps

### Example Flow
```bash
# Individual commits in develop (these determine version bump)
git commit -m "feat: add user authentication"     # Will cause minor bump
git commit -m "fix: resolve login validation bug" # Will cause patch bump  
git commit -m "docs: update API documentation"    # No version impact

# Merge commits (deployment/maintenance tasks)
git merge develop -m "chore: merge develop into staging for release candidate"
git merge staging -m "chore: promote staging to production release"
```

## Semantic Release Channels

- **develop**: `1.2.3-dev.1`, `1.2.3-dev.2`, etc.
- **staging**: `1.3.0-rc.1`, `1.3.0-rc.2`, etc.  
- **production**: `1.3.0`, `1.3.1`, `1.4.0`, etc.

Each channel maintains its own version sequence and can be installed independently using npm/yarn with channel tags.