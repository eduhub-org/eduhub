Add a serverless handler (Node or Python) to an EduHub dispatcher.

A handler is **not done** until all steps below are complete. Full reference:
`docs/SERVERLESS_FUNCTIONS.md`.

## Vocabulary

- **Unit**: one deployed Cloud Function, listed in `functions/units.json`.
- **Dispatcher**: a unit that routes by the `Function-Name` header:
  `functions/callNodeFunction` (Node) and `functions/callPythonFunction`
  (Python).
- **Handler**: one routed function in a dispatcher. New work is a handler,
  not a new unit.

## 0. Choose the runtime

Node (`callNodeFunction`) for anything that talks to Hasura, Keycloak,
Stripe, Matrix, storage or mail. Python (`callPythonFunction`) for PDF
generation, pandas-style reports, or code that reuses
`functions/shared_py/api_clients`.

## 1. Write the handler

Node: `functions/callNodeFunction/<handlerName>/index.js`

```js
/** @type {import('../lib/types.js').Handler} */
const handlerName = async (req, logger) => {
  const { input, session_variables: session } = req.body;
  return { success: true, messageKey: 'HANDLER_DONE' };
};

export default handlerName;
```

- Read env through `lib/config.js`, Hasura through `lib/hasura.js`
  (`createHasuraClient()`), HTTP through `lib/http.js`, the bucket through
  `lib/requestHeaders.js` `getBucket(req)`. Never `process.env` directly.
- Check the caller's rights from `session_variables`; the secret only proves
  the request came from Hasura.

Python: `functions/callPythonFunction/pythonFunctions/<handler_name>.py`

```python
from typing import Any, Dict

def handler_name(arguments: Dict[str, Any]) -> Dict[str, Any]:
    return {"success": True, "messageKey": "HANDLER_DONE"}
```

`arguments` is the whole Hasura payload (`arguments["input"]` for actions).

## 2. Register it

- Node: import in `functions/callNodeFunction/index.js`, add to `functionMap`.
- Python: import in `functions/callPythonFunction/main.py`, add to
  `PYTHON_FUNCTIONS`.

## 3. Response contract

- Body: `{ success, messageKey, error?, ...fields }`, fields at top level.
- Failures the user should see: return `success: false` (status stays 200).
- Event/cron failures worth retrying: add `retryable: true` (dispatcher
  answers 503, Hasura retries) and make the side effect idempotent.
- The dispatcher answers 401 (secret), 404 (unknown name), 500 (server secret
  unset), 400 (Node: `Function-Name` and legacy `name` differ).

## 4. Hasura metadata

Headers for every new entry (standard names, not the legacy `name`/`secret`):

```yaml
headers:
  - name: Hasura-Secret
    value_from_env: HASURA_CLOUD_FUNCTION_SECRET
  - name: Function-Name
    value: <handlerName or handler_name>
  - name: Bucket            # storage handlers only
    value_from_env: HASURA_BUCKET
```

- **Action**: entry in `backend/metadata/actions.yaml` with
  `handler: '{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}'` (or
  `..._CALL_PYTHON_FUNCTION`), `kind: synchronous`, `timeout:` in seconds if
  it may exceed Hasura's 30 s default, `permissions:` for the non-admin roles
  (never add `admin`). Add the signature and result type to
  `backend/metadata/actions.graphql` and the type name under
  `custom_types.objects` in `actions.yaml`.
- **Event trigger**: under `event_triggers:` in
  `backend/metadata/databases/default/tables/public_<Table>.yaml` with
  `webhook_from_env: CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION` and a
  `retry_conf` (`interval_sec`, `num_retries`, `timeout_sec`).
- **Cron trigger**: `backend/metadata/cron_triggers.yaml` with
  `webhook: '{{CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION}}'`.

Apply: `docker compose exec hasura hasura-cli metadata apply`.

## 5. Frontend (actions only)

1. GraphQL document in `frontend-nx/apps/edu-hub/queries/<name>.ts`.
2. From `frontend-nx/`: `GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo`.
3. Call it with `useRoleMutation` / `useRoleQuery` (or `useAdminMutation`,
   `useInstructorQuery`), never `useAuthedQuery`.
4. Add each `messageKey` the UI shows to `locales/de.json` (informal "Du")
   and `locales/en.json`.

## 6. Tests

- Node: `functions/callNodeFunction/<handlerName>/__tests__/<name>.test.js`
  (Jest ESM, `jest.unstable_mockModule`). Run `npm test` in
  `functions/callNodeFunction` (`npm ci` there and in `functions/sendMail`
  first). `__tests__/registry.test.js` fails until the handler is in
  `functionMap` and named by some metadata entry.
- Python: `functions/callPythonFunction/__tests__/test_<handler_name>.py`.
  Run `python -m pytest __tests__` in `functions/callPythonFunction`.
- Lint from `functions/`: `npx --yes eslint@10.14.0 .` and
  `ruff check .`.

## 7. Local check

`docker compose up`, then call the action from the Hasura console
(http://localhost:8080) or the app. New dependencies in a unit: restart
`node_functions` / rebuild `python_functions`
(`.cursor/rules/docker-rebuild.mdc`).

## Output reporting

When invoked, report: runtime and handler name, metadata entries added,
frontend document and regenerated types (if an action), and the test commands
run with their results.
