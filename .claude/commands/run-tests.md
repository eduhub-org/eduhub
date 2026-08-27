Run the EduHub frontend test suite (Jest + React Testing Library).

## Commands

Run from `frontend-nx/`:

```bash
yarn test                                       # full suite
yarn test --watch                               # watch mode
yarn test --testPathPattern="MyComponent"       # filter by path
yarn test --coverage                            # coverage report
```

## Pre-existing repo issue

Tests may fail with:

```
Requires Babel "^7.22.0", but was loaded with "..."
```

This comes from `next/babel` needing a newer Babel than what `jest-config`
bundles. It is a known baseline issue — do not attempt to fix it as a side
effect of an unrelated change. When reporting test results, distinguish
between this environment failure and an actual assertion failure.

## Conventions

- Co-locate tests next to source: `MyComponent.tsx` ↔ `MyComponent.test.tsx`.
- Function tests live under `functions/<name>/__tests__/`.
- Prefer `screen.getByRole(...)` over `getByTestId(...)`.
- Mock externals (`next-auth/react`, `next-intl`, role-aware GraphQL hooks)
  explicitly; reset with `jest.clearAllMocks()` in `beforeEach`.
- For GraphQL, use `MockedProvider` from `@apollo/client/testing` with a list
  of `{ request, result }` mocks; set `addTypename={false}` unless you need it.
- Test observable behavior (what the user sees / can do), not internal
  implementation details.

## Sample pattern

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';

jest.mock('next-auth/react');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MyComponent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the heading', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MyComponent id={1} />
      </MockedProvider>
    );
    expect(screen.getByRole('heading', { name: /title/i })).toBeInTheDocument();
  });
});
```

## End-to-end tests (Playwright)

Separate suite, separate command. Jest mocks GraphQL; the E2E suite drives a real
Hasura + Keycloak stack and is the only place CI checks that the layers agree.

```bash
docker compose up -d          # repo root — the suite attaches, it never starts a stack
cd frontend-nx
yarn playwright install chromium ffmpeg --with-deps   # once per machine
yarn test:e2e                 # whole suite
yarn test:e2e --grep "authentication"
yarn test:e2e:ui              # interactive
yarn test:e2e:report          # HTML report of the last run
yarn type-check:e2e
```

Specs live in `frontend-nx/e2e/`; CI runs them via
`.github/workflows/e2e-tests.yml` on PRs into `develop`. Conventions (read-only
specs, locale-pinned paths, seed fixtures in `support/seed.ts`) are documented in
`frontend-nx/e2e/README.md` — read it before adding a spec.

Note the split when reporting results: `yarn test` failing is a component-level
failure, `yarn test:e2e` failing can also mean the stack never came up. Check
`app.log` and `docker compose logs hasura` before blaming a spec.
