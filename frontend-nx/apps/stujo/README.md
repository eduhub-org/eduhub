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
- Legacy-URL redirects: `proxy.ts` (Next 16's name for what used to be
  `middleware.ts`) 301s the old Rails URLs — see below.

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

## Cutover redirects (`proxy.ts`)

`proxy.ts` handles the three redirect cases the move from the Rails site
needs, and is inert for everything else:

| From | To | Gated on |
|---|---|---|
| a **direct** hit on `stujo.opencampus.sh` / `stujo-<portal>.opencampus.sh` | the matching `stujo.net` host | `STUJO_CANONICAL_REDIRECTS=true` |
| `*.en.stujo.net/<path>` | `<portal>.stujo.net/en/<path>` | always |
| `/stellenangebote/:oldId-:slug` | `/stellenangebote/:newId` via `JobPosting.legacyStujoId` | always (slug-bearing URLs only) |

`STUJO_CANONICAL_REDIRECTS` is a **runtime** env var set by Terraform
(`var.stujo_net_canonical`), not a `NEXT_PUBLIC_` build arg: turning the
canonical redirect on is a new Cloud Run revision rather than a rebuild, so it
can happen the moment Cloudflare serves stujo.net — and be reverted just as
quickly. It is unset locally and on staging, so those hosts never redirect.

### `X-Original-Host`

In production stujo.net is served by Cloudflare, which proxies each host onto
the matching `<service>.opencampus.sh` origin and rewrites the `Host` header on
the way (see `docs/STUJO_PROD_CUTOVER.md` §1). So the `Host` the app sees is
*not* what the visitor typed; the real one arrives in `X-Original-Host`, and
both the proxy and portal resolution prefer it:

- `proxy.ts` builds redirects from it — otherwise a legacy job link would be
  301'd off stujo.net — but only for a host in the stujo.net zone, since an
  unchecked value in a `Location` is an open redirect. Its mere *presence*
  marks a request as already on its public domain, which is what stops the
  canonical redirect from looping.
- `lib/requestHost.ts` feeds it to `resolvePortal`, so branding follows the
  visitor's host rather than the origin's. That is what lets a partner's own
  domain be a `JobPortalDomain` row with no service of its own
  (`docs/STUJO_PROD_CUTOVER.md` §6).

The full sequence is in
[`docs/STUJO_PROD_CUTOVER.md`](../../../docs/STUJO_PROD_CUTOVER.md).

## Local white-label preview

The request host selects the portal, so map the legacy hostnames locally:

```bash
# /etc/hosts (requires sudo)
127.0.0.1  www.stujo.net cau.stujo.net haw-kiel.stujo.net flensburg.stujo.net
```

then open e.g. `http://cau.stujo.net:5001`. Without the host mapping,
`http://localhost:5001` renders the root `stujo` portal (`APP_NAME` in
Docker Compose).
