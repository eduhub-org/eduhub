# ADR 0002: Split cloud function units by secret scope

## Status
Accepted

## Context

EduHub's serverless functions (`functions/`) are deployed as Cloud Functions
(gen2). Until this decision there were eight units: two dispatchers
(`callNodeFunction` with 53 handlers, `callPythonFunction` with 14),
`sendMail`, `apiProxy` and four single-purpose Node units
(`addKeycloakRole`, `removeKeycloakRole`, `updateFromKeycloak`,
`sendQuestionaires`).

- Every `callNodeFunction` handler ran with every secret of the unit: the
  Keycloak admin password, the Matrix admin and Synapse tokens, the Stripe
  key, the Formbricks key, the guest token secret and the Ghost encryption
  key. A bug in an image upload handler could reach the Keycloak admin.
- The four single-purpose units each held their own copy of the Keycloak
  login and Hasura code and ran, like `sendMail`, as the default compute
  service account that the Cloud Run services (Keycloak, Hasura, frontends)
  also use.
- All `callNodeFunction` handlers shared one resource profile (512 MB,
  180 s, max 20), sized for neither image processing nor quick account
  lookups.
- Splitting by business domain (courses, jobs, users, ...) would multiply
  units without separating credentials: most domains need Hasura and mail,
  few need Keycloak or storage.

## Decision

Units are split by the credentials their handlers need and by resource
profile, not by domain.

- **One Node codebase, several entry points.** `functions/callNodeFunction`
  exports three dispatchers built by `createDispatcher` (one request
  contract): `callNodeFunction`, `identity` and `media`. Terraform deploys
  the same zip three times with a different `entry_point`, service account,
  secrets and resources. Isolation comes from the secrets each unit is given,
  not from separate code.
- **`identity`**: Keycloak and Matrix accounts (`createUser`,
  `updateKeycloakUser`, `updateAdminUser`, `getAdminUsers`,
  `claimJobOrganization`, `anonymizeUser` / `deleteMyAccount`, the Matrix room
  handlers, and the folded `addKeycloakRole`, `removeKeycloakRole`,
  `updateFromKeycloak`). Holds Hasura, Keycloak and Matrix secrets and the
  Ghost encryption key (account deletion unsubscribes from newsletters), and
  may delete bucket objects. 256 MB, 180 s, max 5.
- **`media`**: storage files (`saveFile`, `saveImage`,
  `saveOrganizationLogo`, `removeOrganizationLogo`, `getSignedUrl`,
  `makeCertificatePublic`). Holds only Hasura secrets plus bucket access.
  1024 MB for sharp, 120 s, max 20.
- **`callNodeFunction`** keeps everything else, including Stripe (no third
  unit for one key) and the folded `sendQuestionaires` cron.
- The four single-purpose units are folded into the dispatchers.
  `sendMail`, `callPythonFunction` and `apiProxy` are unchanged.
- Every unit runs as its own service account, or the existing shared one for
  `callNodeFunction`, `callPythonFunction` and `apiProxy`, never as the
  default compute account. Terraform builds all units from one module
  (`infrastructure/application/modules/cloud_function`).
- A handler goes into the unit that already holds the credentials it needs.
  A new unit is only worth it for a new secret scope, runtime or resource
  profile.
- A performance split (interactive vs background handlers) is deferred until
  the latency and instance dashboard (`10_monitoring.tf`) shows a need.

## Consequences

- A compromised media handler cannot read Keycloak, Matrix, Stripe or
  Formbricks credentials, and a compromised identity handler cannot read
  Stripe or Formbricks ones. `callNodeFunction` loses the Keycloak and
  Matrix secrets once it stops routing the moved handlers
  (`docs/plans/functions-topology-cleanup.md`).
- **Known limit: every unit still holds `HASURA_ADMIN_SECRET`.** The
  handlers query Hasura as admin, so any unit can read and write every
  table, and through it reach data the split was meant to separate (e.g.
  user records). Narrowing this needs per-unit Hasura roles or a
  different access path; it is out of scope here.
- Every unit also holds `HASURA_CLOUD_FUNCTION_SECRET` and is publicly
  invokable; the secret is the only gate.
- Choosing a unit is part of adding a handler; the registry test checks that
  each Hasura entry calls the unit whose handler map holds the handler.
- An action with `forward_client_headers` passes the caller's headers on to
  the unit, so it must be pinned to its handler in the dispatcher
  (`pinnedActions`); the registry test enforces this.
- One zip still deploys three times, so a broken `callNodeFunction` build
  breaks all three units at once, and a dependency added for one handler
  ships to all three.
- More units mean more cold starts for rarely used handlers. The dashboard
  shows whether this matters.

## Environment inventory

What each unit's handlers read, following every import from the handler
maps in `functions/callNodeFunction/index.js` (handlers, `lib/`, `shared/`,
the dispatcher) and resolving each `lib/config.js` getter to its variables.
Compared against `env` / `secrets` in
`infrastructure/application/06_cloud-functions.tf`. Locally all Node units
run in the one `node_functions` container (`functions/dev.js`), so identity
and media see the same environment as `callNodeFunction`. Recheck this
table when a handler moves or starts reading a new variable.

| Unit | Secrets read | Plain config read |
|------|--------------|-------------------|
| all three (dispatcher) | `HASURA_CLOUD_FUNCTION_SECRET` | `ENVIRONMENT` |
| identity | `HASURA_ADMIN_SECRET`, `KEYCLOAK_PW`, `MATRIX_ADMIN_ACCESS_TOKEN`, `MATRIX_SYNAPSE_ADMIN_TOKEN` (when set), `GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY` (anonymizeUser / deleteMyAccount) | `HASURA_ENDPOINT`, `KEYCLOAK_URL`, `KEYCLOAK_USER`, `MATRIX_*` (5), `FRONTEND_URL`, `STORAGE_BUCKET_PUBLIC_URL`, `STUJO_ADMIN_EMAIL` |
| media | `HASURA_ADMIN_SECRET` | `HASURA_ENDPOINT` |
| callNodeFunction | all of the above plus `FORMBRICKS_API_KEY`, `STRIPE_SECRET_KEY`, `GUEST_TOKEN_SECRET` (unchanged by the split) | identity's plus `FORMBRICKS_API_URL`, `STUJO_FRONTEND_URL`, `STRIPE_TAX_RATE_ID`, `STUJO_SELLER_ORGANIZATION_ID` (unchanged) |

Notes:

- `GUEST_TOKEN_SECRET` is in identity's import graph (`lib/queueEmail.js`
  imports the guest mail footer) but never read there: `createUser` and
  `claimJobOrganization` call `queueEmail` without a `recipientUser`, and the
  footer is only built for guest recipients. identity does not get it.
- `STORAGE_PORT` is read by the storage helpers only in development (local
  emulator); deployed units do not set it.
- `callNodeFunction` also reads `FORMBRICKS_TRUSTED_ORIGINS`,
  `FORMBRICKS_BASE_URL`, `RAUSGEGANGEN_API_URL` and `STUJO_TERMS_URL`, which
  Terraform did not set before the split either; the code falls back to
  defaults.
