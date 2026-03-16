# ADR 0001: Remove Nx module-boundary lint rule

## Status
Accepted

## Context

The frontend repository was simplified from an Nx multi-project workspace to a single-app setup (`frontend-nx/apps/edu-hub`). The previous lint rule `@nx/enforce-module-boundaries` depended on Nx workspace metadata and no longer applies to the current architecture.

## Decision

Remove the Nx module-boundary rule from `frontend-nx/.eslintrc.json`.

## Consequences

- There is no automatic Nx-level cross-module import boundary enforcement.
- Import hygiene is maintained through existing ESLint rules, TypeScript checks, and code review.

## Reintroduction Guidance

If the repository regrows into multiple apps/libs, reintroduce:

1. Nx workspace configuration (`nx.json`, project definitions, Nx tooling).
2. `@nx/eslint-plugin` and related Nx lint dependencies.
3. `@nx/enforce-module-boundaries` in root ESLint config with explicit `depConstraints`.
