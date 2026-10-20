# Serverless Functions

The guide for EduHub's serverless functions in `functions/`, Node and Python.
Playbook version: `.claude/commands/create-function.md`.

## Vocabulary

- **Unit**: one deployed Cloud Function (one zip, one URL, one entry point).
- **Dispatcher**: a unit that routes each request to one of many handlers by
  the `Function-Name` header: `callNodeFunction`, `identity`, `media` (one
  Node codebase, three entry points) and `callPythonFunction`.
- **Handler**: one routed function inside a dispatcher, e.g.
  `callNodeFunction/saveImage/` or `callPythonFunction/pythonFunctions/create_certificates.py`.

## Units

`functions/units.json` is the list of units. The zip workflow
(`.github/workflows/zip-and-store-cloud-functions.yml`) packages one zip per
unit without a `source`, and `functions/dev.js` / `functions/dev.py` serve
them locally on these ports. A unit with `"source": "callNodeFunction"` has no
folder or zip of its own: it is callNodeFunction's code with another entry
point (Terraform deploys `callNodeFunction.zip` with that `entry_point`).

Units are split by the secrets their handlers need, not by domain
(`docs/adr/0002-function-units-by-secret-scope.md`).

| Unit | Runtime | Kind | Holds | Local port | Hasura URL variable |
|------|---------|------|-------|-----------|---------------------|
| `callNodeFunction` | Node 22 | dispatcher: enrollment, guests, Formbricks, Stripe, job postings, mails, syncs | Hasura, Stripe, Formbricks, guest token, Ghost key | 42022 | `CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION` |
| `identity` | Node 22 (callNodeFunction code) | dispatcher: Keycloak and Matrix accounts | Hasura, Keycloak, Matrix; deletes bucket objects | 42021 | `CLOUD_FUNCTION_LINK_IDENTITY` |
| `media` | Node 22 (callNodeFunction code) | dispatcher: storage files | Hasura; bucket objects, signed URLs | 42023 | `CLOUD_FUNCTION_LINK_MEDIA` |
| `callPythonFunction` | Python 3.11 | dispatcher | Hasura, Zoom, LMS, Mailgun | 42025 | `CLOUD_FUNCTION_LINK_CALL_PYTHON_FUNCTION` |
| `sendMail` | Node | MailLog insert trigger, sends via Mailgun | Mailgun, Hasura mail user | 42019 | `CLOUD_FUNCTION_LINK_SEND_MAIL` |
| `apiProxy` | Python | external API (Participants, MOOCHub), not called by Hasura | Hasura | 42026 | — |

`addKeycloakRole`, `removeKeycloakRole`, `updateFromKeycloak` (now identity
handlers) and `sendQuestionaires` (now a callNodeFunction handler) are still
listed in `units.json` and deployed for one release, but no Hasura entry calls
them; they go with `docs/plans/functions-topology-cleanup.md`.

New work goes into a dispatcher as a handler. A new unit is only worth it for
a different runtime, secret scope or resource profile.

## Request contract

Hasura calls a unit with a POST. The body is Hasura's payload: `action`,
`input`, `session_variables`, `request_query` for actions; `event` for event
triggers; `scheduled_time` and `payload` for cron triggers.

### Headers

The standard names are `Function-Name`, `Hasura-Secret` and `Bucket`. Most
Node metadata still sends the legacy `name` and `secret`; the switch is
tracked in `docs/plans/functions-header-switch.md`.

| Header | Value | Node dispatchers | callPythonFunction | sendMail |
|--------|-------|------------------|--------------------|----------|
| `Hasura-Secret` | env `HASURA_CLOUD_FUNCTION_SECRET` | also accept legacy `secret` | required | also accepts legacy `secret` |
| `Function-Name` | handler name | also accept legacy `name` | falls back to `action.name` | — |
| `Bucket` | env `HASURA_BUCKET` | read by file handlers via `getBucket(req)` | not read | — |

The Node dispatchers (`callNodeFunction`, `identity`, `media`) are all built by
`createDispatcher` in `functions/callNodeFunction/lib/dispatcher.js` and share
this contract; each routes only the handlers in its own map and answers 404
for the others.

Header names are case-insensitive: Node lowercases them (`req.headers.bucket`
is `Bucket`), Flask looks them up case-insensitively. Handler-specific headers
(`file-path`, `is-public`, `sizes`, `role`, `operation`, `mailtag`, ...) keep
their names.

During the transition the Node dispatchers prefer `Function-Name` and
`Hasura-Secret` when both spellings are sent; two *different* function names
answer 400. They log the spelling used at debug level ("Request header
names").

**Actions that forward client headers.** With `forward_client_headers: true`
Hasura passes the caller's own HTTP headers on to the unit, so a caller could
add a `Function-Name` or `name` header. Such an action must be listed in its
dispatcher's `pinnedActions` (`identityPinnedActions` in `index.js`): the
handler then follows `action.name` in the body, which Hasura sets, and a
routing header naming another handler answers 400. The registry test fails for
an unpinned one. Today only `updateFromKeycloak` forwards client headers.

### Status codes (both dispatchers)

| Status | When | `messageKey` |
|--------|------|--------------|
| 200 | handler ran, including `success: false` results and thrown errors | handler's own, or `INTERNAL_SERVER_ERROR` |
| 400 | Node only: `Function-Name` and `name` differ | `CONFLICTING_FUNCTION_NAME` |
| 401 | secret header missing or wrong | `MISSING_SECRET` / `INVALID_SECRET` |
| 404 | no handler by that name in this unit | `FUNCTION_NOT_FOUND` |
| 500 | `HASURA_CLOUD_FUNCTION_SECRET` unset on the server | `SERVER_MISCONFIGURED` |
| 503 | event or cron delivery and the result has `retryable: true` (Node: unless `httpStatus` is non-2xx) | handler's own |
| any | Node only: the result has an integer `httpStatus` (removed from the body) | handler's own |

Node precedence for an event or cron delivery: a `retryable: true` result
answers 503 even when it also sets a 2xx `httpStatus`, since a 2xx would end
Hasura's retries; a non-2xx `httpStatus` is sent as is (Hasura retries it
anyway). Outside event and cron deliveries `retryable` is ignored.

Hasura retries an event or cron delivery on any non-2xx status, up to the
trigger's `retry_conf`. Actions never retry: they read the body, so a failed
action is a 200 with `success: false`. A thrown error is a 200 too, so of a
handler's own failures only an explicit `retryable: true` result is retried;
a timeout or a platform 5xx is retried as well. A trigger with retries
therefore needs a handler whose side effect is idempotent across deliveries.

### Response body

```js
{ success: true | false, messageKey: 'UPPER_SNAKE_CASE', error?: string,
  retryable?: boolean, ...fields }
// non-2xx only, added by the dispatcher:
//   message: string, extensions: { code: messageKey }
```

- Every non-2xx body (both dispatchers) also carries `message` (the `error`
  text) and `extensions: { code: messageKey }`: for a non-2xx action answer
  Hasura shows only these two fields in its GraphQL error. The dispatchers
  add them to their own 400/401/404/500 bodies and to a handler's 503 or
  non-2xx `httpStatus` body, keeping a `message` or `extensions` the handler
  set. The single-purpose Node units still deployed send
  `{ error, message }` with their 401.
- Return result fields at the top level (they map onto the action's output
  type), not under a nested object.
- `messageKey` is the translation key the frontend shows.
- Node: `httpStatus` is for the few handlers whose callers need a non-2xx:
  `updateFromKeycloak` and `getSignedUrl` (Hasura turns a 4xx action answer
  into a GraphQL error and passes on its `message` and `extensions`; a 5xx
  reaches the client only as a generic error), and the Keycloak role
  triggers (500 so Hasura retries a configuration error). `getSignedUrl`
  needs it because its output type has only a required `link`: a 200
  without one fails Hasura's output validation, so a denied path answers
  403 (`FILE_ACCESS_DENIED`) and a failed load 400 (`FILE_LOAD_ERROR`).
  Prefer `success: false` or `retryable` otherwise.
- Node: a result without `success`/`error` is wrapped as
  `{ success: true, data }`, except for mutation actions, which get it as is.
  A thrown error becomes `{ success: false, error, messageKey }` with
  `error.messageKey` or `INTERNAL_SERVER_ERROR`.
- Python: a result without `success`/`error` is wrapped as
  `{ success: true, result }`. An exception becomes
  `{ success: false, error, messageKey: 'INTERNAL_SERVER_ERROR' }`.

## Add a Node handler

0. **Pick the unit by the credentials the handler needs** (the Holds column
   above): Keycloak or Matrix → `identity`; storage files only (with Hasura)
   → `media`; anything else, including Stripe, Formbricks, the guest token
   or the Ghost key → `callNodeFunction`. A handler that needs credentials of
   two units goes to the one that holds both, or is raised before adding a
   secret to a unit. Terraform gives each unit only its own secrets
   (`infrastructure/application/06_cloud-functions.tf`); add a new secret
   there for exactly the unit that needs it.
1. **Folder**: `functions/callNodeFunction/<handlerName>/index.js` (camelCase):

   ```js
   /** @type {import('../lib/types.js').Handler} */
   const handlerName = async (req, logger) => {
     const { input, session_variables: session } = req.body;
     // ... use lib/ helpers, never process.env directly
     return { success: true, messageKey: 'HANDLER_DONE' };
   };

   export default handlerName;
   ```

2. **Register**: import it in `functions/callNodeFunction/index.js` and add
   it to the unit's map: `callNodeFunctionHandlers`, `identityHandlers` or
   `mediaHandlers` (static imports only).
3. **Hasura metadata** (see [Hasura metadata](#hasura-metadata)), with
   `Function-Name: <handlerName>` and the unit's URL variable
   (`CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION`, `_IDENTITY` or `_MEDIA`).
4. **Tests**: `functions/callNodeFunction/<handlerName>/__tests__/*.test.js`
   (Jest, ESM; mock modules with `jest.unstable_mockModule`). Run `npm test`
   in `functions/callNodeFunction`. `__tests__/registry.test.js` fails until
   the folder is in exactly one unit's map *and* a metadata entry with that
   unit's URL names it.
5. **Frontend**, if it is an action (see [Frontend](#frontend)).

## Add a Python handler

1. **File**: `functions/callPythonFunction/pythonFunctions/<handler_name>.py`
   (snake_case) with a function of the same name taking the whole payload:

   ```python
   import logging
   from typing import Any, Dict

   def handler_name(arguments: Dict[str, Any]) -> Dict[str, Any]:
       """What it does. arguments["input"] holds the action input."""
       logging.info("########## handler_name ##########")
       return {"success": True, "messageKey": "HANDLER_DONE"}
   ```

   Hasura and storage clients live in `api_clients/` (`eduhub_client`,
   `storage_client`, `mailgun_client`, ...).
2. **Register**: import it in `functions/callPythonFunction/main.py` and add
   it to `PYTHON_FUNCTIONS`.
3. **Hasura metadata**, with `Function-Name: <handler_name>` and the
   `CALL_PYTHON_FUNCTION` URL.
4. **Tests**: `functions/callPythonFunction/__tests__/test_<handler_name>.py`;
   `conftest.py` puts `functions/shared_py` and the unit on `sys.path`. Run
   `python -m pytest __tests__` in `functions/callPythonFunction` after
   `pip install -r requirements-dev.txt`.
5. **Frontend**, if it is an action.

## Hasura metadata

Every entry sends `Hasura-Secret` from env and `Function-Name` as a value,
to the URL of the unit whose map holds the handler. The examples use
callNodeFunction; for an identity or media handler use
`CLOUD_FUNCTION_LINK_IDENTITY` / `CLOUD_FUNCTION_LINK_MEDIA` instead.
Admin needs no permission entry.

**Action** (`backend/metadata/actions.yaml`, plus the type in
`actions.graphql` and its name under `custom_types.objects` in
`actions.yaml`):

```yaml
- name: myAction
  definition:
    kind: synchronous   # mutations whose result the frontend reads
    handler: '{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}'
    timeout: 120        # seconds; Hasura's default is 30
    headers:
      - name: Hasura-Secret
        value_from_env: HASURA_CLOUD_FUNCTION_SECRET
      - name: Function-Name
        value: myHandler
      - name: Bucket    # only for handlers that use storage
        value_from_env: HASURA_BUCKET
  permissions:
    - role: user_access
```

```graphql
type Mutation {
  myAction(courseId: Int!): MyActionResult!
}

type MyActionResult {
  success: Boolean!
  messageKey: String!
  error: String
}
```

**Event trigger** (`event_triggers:` in
`backend/metadata/databases/default/tables/public_<Table>.yaml`):

```yaml
- name: my_trigger
  definition:
    enable_manual: false
    insert:
      columns: '*'
  retry_conf:
    interval_sec: 300
    num_retries: 5
    timeout_sec: 120
  webhook_from_env: CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION
  headers:
    - name: Hasura-Secret
      value_from_env: HASURA_CLOUD_FUNCTION_SECRET
    - name: Function-Name
      value: myHandler
```

**Cron trigger** (`backend/metadata/cron_triggers.yaml`): `webhook:
'{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}'`, `schedule`, `payload`,
`retry_conf` (`num_retries`, `retry_interval_seconds`, `timeout_seconds`,
`tolerance_seconds`), and the same two headers.

Apply locally with `docker compose exec hasura hasura-cli metadata apply`.

## Frontend

For an action (AGENTS.md rule 3):

1. Add the GraphQL document to `frontend-nx/apps/edu-hub/queries/<name>.ts`.
2. Regenerate types from `frontend-nx/`:
   `GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo`.
3. Call it with `useRoleMutation` / `useRoleQuery` (or the admin/instructor
   variants) from `hooks/authedMutation.ts` / `hooks/authedQuery.ts`.
4. Add every `messageKey` the UI shows to `locales/de.json` and
   `locales/en.json`.

## Shared code

- `functions/shared/` (Node, ESM, no dependencies): `security.js`
  (`secretsMatch`, `getProvidedSecret`), Keycloak user merge, Matrix handles.
  Each Node unit links it as `./shared -> ../shared`; tests run with
  `node --test 'shared/*.test.js'` from `functions/`.
- `functions/shared_py/api_clients/`: the Python clients, linked as
  `api_clients -> ../shared_py/api_clients` into both Python units.
- The zip workflow follows these symlinks and fails if an archive still holds
  one. On Windows, enable `core.symlinks` (and Developer Mode) before cloning.
- Every Node unit is ESM and commits its own `package-lock.json`; change
  dependencies with `npm install <pkg>` inside the unit.

callNodeFunction's `lib/` (use these instead of `process.env` or ad-hoc
clients):

- `lib/config.js`: every environment variable, read at call time
  (`requireEnv`, `hasuraConfig`, `cloudFunctionSecret`, ...).
- `lib/hasura.js`: `createHasuraClient()`, the admin GraphQL client.
- `lib/logger.js`: the winston JSON logger (debug outside production) for
  modules that are not passed one; never import it from `../index.js`.
- `lib/http.js`: fetch-based JSON client with timeouts.
- `lib/requestHeaders.js`: `getFunctionName`, `getBucket`.
- `lib/dispatcher.js`: `createDispatcher({ name, handlers, pinnedActions })`,
  the request contract of all three Node entry points.
- `lib/queueEmail.js`: renders a MailTemplate into MailLog, which `sendMail`
  delivers.
- `lib/types.js`: JSDoc types (`Handler`, `HasuraRequestBody`).

## Local development

`docker compose up` starts `node_functions` (all Node units via `dev.js`,
ports from `units.json`, plus a fake storage bucket on 4001; `identity` and
`media` run from `functions/callNodeFunction` with `FUNCTION_TARGET` set to
their entry point) and
`python_functions` (`dev.py`, ports 42025/42026). Hasura reaches them through
the `CLOUD_FUNCTION_LINK_*` variables in `docker-compose.yml`. After a
dependency change, rebuild or restart as `.cursor/rules/docker-rebuild.mdc`
describes.

To run one Node dispatcher by hand: `PORT=42021 FUNCTION_TARGET=identity npm
start` in `functions/callNodeFunction`.

## Deployment

`infrastructure/application/06_cloud-functions.tf` has one entry per unit in
`local.cloud_function_units` (zip, entry point, memory, timeout, max
instances, env, secrets, service account) and deploys each through
`modules/cloud_function`. Every unit runs as a dedicated service account that
may read exactly its secrets, except `callNodeFunction`, `callPythonFunction`
and `apiProxy`, which share `custom_cloud_function_account` (its grants are
listed in the same file). Keep a unit's `timeout` at or above the longest
Hasura `timeout` / `timeout_sec` of its handlers. The dashboard "EduHub cloud
functions" (`10_monitoring.tf`) shows p95 latency, instances and request rate
per unit.

## CI

`.github/workflows/functions-code-checks.yml` runs on changes to
`functions/**` or `backend/metadata/**`, and gates the zip/deploy pipelines:

- Jest in `callNodeFunction` (also runs `sendMail`'s suites and the registry
  test against the metadata), after `npm ci` in both units.
- `tsc` (TypeScript 5.9.3, JSDoc `checkJs`) on the files listed in
  `callNodeFunction/tsconfig.json`.
- `node --test 'shared/*.test.js'`.
- `pytest` in `callPythonFunction` and `apiProxy` (Python 3.11).
- ESLint 10.14.0 (`functions/eslint.config.mjs`) and ruff 0.17.3
  (`functions/ruff.toml`), errors only.
