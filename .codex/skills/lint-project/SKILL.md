---
name: lint-project
description: Run and interpret EduHub frontend linting. Use when checking code style, running ESLint, fixing lint errors, or matching the repository's frontend lint behavior from CI.
---
# Lint Project

Use this skill for frontend linting work.

## Main Command

Run from `frontend-nx`:

```bash
yarn lint
```

Auto-fix where appropriate:

```bash
yarn lint --fix
```

## Expectations

- this matches the frontend lint step used in CI
- use Node.js 20.x and Yarn 3.4.1 when reproducing local results
- if local and CI results differ, reinstall dependencies with the repo's locked versions

## Good Workflow

1. run lint
2. apply `--fix` if the failures are mechanical
3. address remaining semantic issues manually
4. rerun lint to verify a clean result

## Common Manual Fixes

- remove unused imports
- correct hook dependency issues
- tighten TypeScript types
- align with existing frontend patterns instead of suppressing lint rules by default
