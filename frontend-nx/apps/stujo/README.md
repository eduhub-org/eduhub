# StuJo app

Next.js app for the StuJo job board (stujo.net), sharing the EduHub backend.
See `docs/STUJO_INTEGRATION_PLAN.md` for the full plan.

## Status (phase 3 scaffold)

- Public pages (SSR, anonymous role): portal landing `/`, job list
  `/stellenangebote` with region/type/occupation/text filters, job detail
  `/stellenangebote/[id]`, employer info `/fuer-arbeitgeber` with prices.
- Portal resolution: request host → `AppSettings.domain` → branding via CSS
  variables (fallback: `APP_NAME` env var, then the root `stujo` portal).
- Auth: same Keycloak/NextAuth setup as edu-hub (re-exported).
- Still to come: employer dashboard (create/manage postings, Stripe
  checkout), admin views, the actual StuJo design port, legacy-URL
  redirect middleware.

## Code sharing

Shared infrastructure (Apollo client, NextAuth config, later the role-aware
hooks and generated types) is imported directly from `apps/edu-hub` through
the `@eduhub/*` tsconfig alias, enabled by `experimental.externalDir` in
`next.config.js`. Because builds run from the workspace root and the
Dockerfiles `COPY . .`, this works identically in dev and CI — no symlinks
or copy steps. Extracting these modules into root-level `libs/` is a
follow-up cleanup once both apps' needs have settled.

## Development

```bash
# from frontend-nx/
yarn start:stujo         # dev server on :5001
yarn build:stujo         # production build
yarn type-check:stujo    # tsc
```

Requires the EduHub backend running (`docker compose up` at repo root) and
`NEXT_PUBLIC_API_URL` pointing at Hasura (e.g. http://localhost:8080/v1/graphql).
