# End-to-end tests (Playwright)

Browser tests that drive the **whole** EduHub stack: Next.js, Hasura, Postgres,
Keycloak and the node serverless functions. They are the only tests in the repo
that cover the wiring _between_ those layers — NextAuth against Keycloak, Apollo
against Hasura, and which Hasura role a session's JWT actually carries.

Jest (`yarn test`) stays the place for component behaviour with mocked GraphQL;
add a spec here only when the point of the test is that the real services agree.

## Running locally

Playwright never starts a stack — it attaches to one. Bring the dev stack up from
the repository root and run the suite from `frontend-nx/`:

```bash
docker compose up -d                 # repo root; frontend lands on :5000
cd frontend-nx
yarn playwright install chromium ffmpeg --with-deps   # once per machine
yarn test:e2e                        # whole suite
yarn test:e2e --grep "authentication"   # one describe block
yarn test:e2e --headed --project=chromium   # watch it happen
yarn test:e2e:ui                     # Playwright's interactive UI
yarn test:e2e:report                 # open the HTML report of the last run
```

`docker compose up` runs `next dev`, so the first visit to each route pays a
compile. If a spec times out on its very first navigation, hit the page in a
browser once to warm it, or run against a production build the way CI does:

```bash
cd frontend-nx && yarn build && yarn start:prod
```

The suite reads two optional environment variables, both defaulting to the dev
stack, so a differently wired stack needs no spec changes:

| Variable            | Default                  | Meaning                              |
| ------------------- | ------------------------ | ------------------------------------ |
| `E2E_BASE_URL`      | `http://localhost:5000`  | Where the frontend is served         |
| `E2E_KEYCLOAK_URL`  | `http://127.0.0.1:28080` | Browser-facing Keycloak origin       |
| `E2E_USER_PASSWORD` | `dev`                    | Password of the seeded test accounts |

`E2E_KEYCLOAK_URL` must match the app's `NEXT_PUBLIC_AUTH_URL`, which is baked
into the NextAuth Keycloak provider's `issuer` at build time. Mixing `localhost`
and `127.0.0.1` between the two fails the token exchange with an error that
points nowhere near the cause.

## Running in CI

`.github/workflows/e2e-tests.yml` runs on pull requests into `develop` that touch
`frontend-nx/`, `backend/`, `keycloak/`, `functions/` or `docker-compose.yml`, and
can be started by hand (`workflow_dispatch`, with an optional `--grep` filter) or
called from another workflow (`workflow_call`).

It differs from a local run in two ways worth knowing when a failure reproduces
in CI but not on your machine:

- The frontend is a **production build** served with `yarn start:prod`, not
  `next dev`. Anything that only breaks under `NODE_ENV=production` — a baked
  `NEXT_PUBLIC_*` value, a hydration mismatch — shows up here first.
- `python_functions` is **not started**. No spec needs a Python action today; if
  one comes to need one, add the service to the workflow's compose command and to
  its log collection.

Every run uploads a `playwright-report` artifact; failures also upload `app.log`
and the container logs, and the job log tails the last 400 lines of `app.log`
inline.

## Layout

```
e2e/
  playwright.config.ts        base URL, timeouts, locale pinning, artifacts
  tests/
    public-pages.spec.ts      anonymous routes, i18n routing, anonymous Hasura reads
    authentication.spec.ts    Keycloak sign-in, role-gated navigation and pages
  support/
    login.ts                  Keycloak sign-in helper, header account-button locator
    users.ts                  seeded Keycloak accounts and the roles they carry
    seed.ts                   fixtures from backend/seeds/default/initial_seeds.sql
```

## Conventions

- **Keep specs read-only.** The suite runs `fullyParallel`, against one shared
  Postgres, with no per-test reset. A spec that writes needs to create and clean
  up its own data, and should say so at the top of the file.
- **Assert on roles, not on `getByTestId`.** `getByRole` / `getByText` is what the
  Jest suite already prefers, and it survives styling changes.
- **Pin the locale in the path.** German is the default locale and served
  unprefixed (`/imprint`); English lives under `/en` (`/en/imprint`). The config
  pins the browser to `de-DE` so Next.js's `Accept-Language` redirect on `/`
  cannot make the suite depend on the machine it runs on.
- **Reference the seed, don't hardcode it.** Row ids and titles belong in
  `support/seed.ts` with a pointer to the SQL, so a reseed breaks one file.
- **Prefer date-independent fixtures.** The start page filters tiles by semester,
  so a spec anchored on "the current course" rots. `support/seed.ts` deliberately
  points at a course whose visibility does not depend on today's date.
- **New account needed?** Add it to `keycloak/imports-dev/edu-hub.json` (with its
  `hasura` client roles) _and_ to `support/users.ts`, and remember Hasura's `User`
  seed has to contain the matching row.
