---
name: lint-project
description: Run ESLint on the EduHub frontend. Use when the user asks to lint code, check code style, fix lint errors, or run eslint.
---
# Lint Project

## Quick Commands

```bash
# From frontend-nx directory
cd frontend-nx

# Lint edu-hub app
yarn nx run edu-hub:lint

# Lint with auto-fix
yarn nx run edu-hub:lint --fix

# Lint rent-a-scientist app
yarn nx run rent-a-scientist:lint
```

## Common Issues

### Many errors? Run with --fix first
Most formatting issues can be auto-fixed:
```bash
yarn nx run edu-hub:lint --fix
```

### Specific file lint
```bash
yarn nx run edu-hub:lint --files=apps/edu-hub/components/MyComponent.tsx
```

## After Linting

1. Review remaining errors that couldn't be auto-fixed
2. Common manual fixes:
   - Unused imports → Remove them
   - Missing dependencies in useEffect → Add to dependency array or disable rule with comment
   - Type errors → Add proper TypeScript types
