---
name: run-tests
description: Run Jest tests for EduHub. Use when the user asks to run tests, execute test suite, check test coverage, or verify code changes.
---
# Run Tests

## Quick Commands

```bash
# From frontend-nx directory
cd frontend-nx

# Run all tests for edu-hub
yarn test

# Run tests in watch mode
yarn test --watch

# Run specific test file
yarn test --testPathPattern="MyComponent.test"

# Run with coverage
yarn test --coverage
```

## Test File Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Located next to the source file or in `__tests__/` folder
- Use Jest + React Testing Library

## Common Patterns

### Running subset of tests
```bash
# Tests matching a pattern
yarn test --testPathPattern="TableGrid"

# Single test file
yarn test --testPathPattern="components/common/TableGrid/TableGrid.test.tsx"
```

### Debug failing tests
```bash
# Verbose output
yarn test --verbose

# Run only failed tests
yarn test --onlyFailures
```
