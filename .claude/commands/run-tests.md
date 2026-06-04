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
