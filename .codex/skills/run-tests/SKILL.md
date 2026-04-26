---
name: run-tests
description: Run and interpret EduHub tests. Use when executing the Jest suite, running a subset of frontend tests, checking coverage, or verifying changes before merge.
---
# Run Tests

Use this skill for frontend test execution and test-targeting advice.

## Main Commands

Run from `frontend-nx`:

```bash
yarn test
yarn test --watch
yarn test --coverage
yarn test --testPathPattern="MyComponent.test"
```

## Test Conventions

- co-located test files are normal
- Jest + React Testing Library are the default frontend stack
- prefer behavior-oriented tests over implementation-detail tests

## Common Patterns

- run a single file or pattern when iterating on a focused change
- use verbose output or only-failures mode when debugging
- rerun the smallest meaningful scope first, then rerun the broader suite

## Known Repo Issue

This repo has a pre-existing Jest/Babel version conflict documented in `AGENTS.md`.
If tests fail with a Babel version requirement rather than with a feature-specific
assertion, treat that as an environment/repo baseline issue rather than proof that
your change is wrong.

## Output Style For This Skill

When reporting test results, distinguish clearly between:

- real regression or assertion failures
- environment or baseline test-harness problems
