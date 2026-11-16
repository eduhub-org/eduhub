# Serverless Functions

The guide for EduHub's serverless functions in `functions/`, Node and Python.
Playbook version: `.claude/commands/create-function.md`.

## Vocabulary

- **Unit**: one deployed Cloud Function (one zip, one URL, one entry point).
- **Dispatcher**: a unit that routes each request to one of many handlers by
  the `Function-Name` header: `callNodeFunction` and `callPythonFunction`.
- **Handler**: one routed function inside a dispatcher, e.g.
  `callNodeFunction/saveImage/` or `callPythonFunction/pythonFunctions/create_certificates.py`.

## Units

`functions/units.json` is the list of units. The zip workflow
(`.github/workflows/zip-and-store-cloud-functions.yml`) packages exactly these,
and `functions/dev.js` / `functions/dev.py` serve them locally on these ports.

| Unit | Runtime | Kind | Local port | Hasura URL variable |
|------|---------|------|-----------|---------------------|
| `callNodeFunction` | Node 22 | dispatcher | 42022 | `CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION` |
| `callPythonFunction` | Python 3.11 | dispatcher | 42025 | `CLOUD_FUNCTION_LINK_CALL_PYTHON_FUNCTION` |
| `sendMail` | Node | MailLog insert trigger, sends via Mailgun | 42019 | `CLOUD_FUNCTION_LINK_SEND_MAIL` |
| `updateFromKeycloak` | Node | action, syncs a user from Keycloak | 42020 | `CLOUD_FUNCTION_LINK_UPDATE_FROM_KEYCLOAK` |
| `addKeycloakRole` | Node | event trigger, `role` header | 42000 | `CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE` |
| `removeKeycloakRole` | Node | event trigger, `role` header | 42002 | `CLOUD_FUNCTION_LINK_REMOVE_KEYCLOAK_ROLE` |
| `sendQuestionaires` | Node | cron | 42024 | `CLOUD_FUNCTION_LINK_SEND_QUESTIONAIRES` |
| `apiProxy` | Python | external API (Participants, MOOCHub), not called by Hasura | 42026 | — |

New work goes into a dispatcher as a handler. A new unit is only worth it for
a different runtime or secret scope.

## Request contract

Hasura calls a unit with a POST. The body is Hasura's payload: `action`,
`input`, `session_variables`, `request_query` for actions; `event` for event
triggers; `scheduled_time` and `payload` for cron triggers.

### Headers

The standard names are `Function-Name`, `Hasura-Secret` and `Bucket`. Most
Node metadata still sends the legacy `name` and `secret`; the switch is
tracked in `docs/plans/functions-header-switch.md`.

| Header | Value | callNodeFunction | callPythonFunction | Other Node units |
|--------|-------|------------------|--------------------|------------------|
| `Hasura-Secret` | env `HASURA_CLOUD_FUNCTION_SECRET` | also accepts legacy `secret` | required | also accept legacy `secret` |
| `Function-Name` | handler name | also accepts legacy `name` | falls back to `action.name` | — |
| `Bucket` | env `HASURA_BUCKET` | read by file handlers via `getBucket(req)` | not read | — |

Header names are case-insensitive: Node lowercases them (`req.headers.bucket`
is `Bucket`), Flask looks them up case-insensitively. Handler-specific headers
(`file-path`, `is-public`, `sizes`, `role`, `operation`, `mailtag`, ...) keep
their names.

During the transition callNodeFunction prefers `Function-Name` and
`Hasura-Secret` when both spellings are sent; two *different* function names
answer 400. It logs the spelling used at debug level ("Request header names").

### Status codes (both dispatchers)

| Status | When | `messageKey` |
|--------|------|--------------|
| 200 | handler ran, including `success: false` results and thrown errors | handler's own, or `INTERNAL_SERVER_ERROR` |
| 400 | Node only: `Function-Name` and `name` differ | `CONFLICTING_FUNCTION_NAME` |
| 401 | secret header missing or wrong | `MISSING_SECRET` / `INVALID_SECRET` |
| 404 | no handler by that name | `FUNCTION_NOT_FOUND` |
| 500 | `HASURA_CLOUD_FUNCTION_SECRET` unset on the server | `SERVER_MISCONFIGURED` |
| 503 | event or cron delivery and the result has `retryable: true` | handler's own |

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
```

- Return result fields at the top level (they map onto the action's output
  type), not under a nested object.
- `messageKey` is the translation key the frontend shows.
- Node: a result without `success`/`error` is wrapped as
  `{ success: true, data }`, except for mutation actions, which get it as is.
  A thrown error becomes `{ success: false, error, messageKey }` with
  `error.messageKey` or `INTERNAL_SERVER_ERROR`.
- Python: a result without `success`/`error` is wrapped as
  `{ success: true, result }`. An exception becomes
  `{ success: false, error, messageKey: 'INTERNAL_SERVER_ERROR' }`.

## Add a Node handler

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
   it to `functionMap` (static imports only).
3. **Hasura metadata** (see [Hasura metadata](#hasura-metadata)), with
   `Function-Name: <handlerName>` and the `CALL_NODE_FUNCTION` URL.
4. **Tests**: `functions/callNodeFunction/<handlerName>/__tests__/*.test.js`
   (Jest, ESM; mock modules with `jest.unstable_mockModule`). Run `npm test`
   in `functions/callNodeFunction`. `__tests__/registry.test.js` fails until
   the folder is in `functionMap` *and* some metadata entry names it.
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

Every entry sends `Hasura-Secret` from env and `Function-Name` as a value.
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
- `lib/queueEmail.js`: renders a MailTemplate into MailLog, which `sendMail`
  delivers.
- `lib/types.js`: JSDoc types (`Handler`, `HasuraRequestBody`).

## Local development

`docker compose up` starts `node_functions` (all Node units via `dev.js`,
ports from `units.json`, plus a fake storage bucket on 4001) and
`python_functions` (`dev.py`, ports 42025/42026). Hasura reaches them through
the `CLOUD_FUNCTION_LINK_*` variables in `docker-compose.yml`. After a
dependency change, rebuild or restart as `.cursor/rules/docker-rebuild.mdc`
describes.

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
