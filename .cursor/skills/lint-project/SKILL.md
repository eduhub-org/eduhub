---
name: lint-project
description: Run ESLint on the EduHub frontend. Use when the user asks to lint code, check code style, fix lint errors, or run eslint.
---
# Lint Project

## Quick Commands

```bash
# From frontend-nx directory
cd frontend-nx

# Lint edu-hub app (matches GitHub Action CI)
yarn lint

# Lint with auto-fix
yarn lint --fix
```

## Alignment with GitHub Action

The GitHub Action (`.github/workflows/frontend-code-checks.yml`) uses:
- `yarn lint`
- Node.js 20.x
- Fresh `yarn install --immutable` before linting

**To match CI results locally:**
1. Use `yarn lint` (as shown in commands above)
2. Ensure Node.js 20.x (matches CI)
3. Reinstall dependencies with `yarn install --immutable` if results differ

## Common Issues

### Many errors? Run with --fix first
Most formatting issues can be auto-fixed:
```bash
yarn lint --fix
```

### Specific file lint
```bash
eslint apps/edu-hub/components/MyComponent.tsx
```

## After Linting

1. Review remaining errors that couldn't be auto-fixed
2. Common manual fixes:
   - Unused imports → Remove them
   - Missing dependencies in useEffect → Add to dependency array or disable rule with comment
   - Type errors → Add proper TypeScript types
