---
name: create-function
description: Add a serverless handler to EduHub's Node (callNodeFunction) or Python (callPythonFunction) dispatcher. Use when adding a Hasura action, event trigger, or cron trigger backed by a cloud function.
---
# Create Function

Full playbook: `.claude/commands/create-function.md`. Reference:
`docs/SERVERLESS_FUNCTIONS.md`.

## Required Workflow

A handler is not done until all steps are done:

1. Handler: `functions/callNodeFunction/<handlerName>/index.js` (default
   export `async (req, logger) => body`) or
   `functions/callPythonFunction/pythonFunctions/<handler_name>.py`
   (`def handler_name(arguments)`).
2. Register it in `functionMap` (`callNodeFunction/index.js`) or
   `PYTHON_FUNCTIONS` (`callPythonFunction/main.py`).
3. Hasura metadata: action (`actions.yaml` + `actions.graphql` +
   `custom_types`), event trigger (`webhook_from_env`) or cron trigger, with
   headers `Hasura-Secret` (env `HASURA_CLOUD_FUNCTION_SECRET`) and
   `Function-Name`; `Bucket` (env `HASURA_BUCKET`) for storage handlers.
   Never add `admin` permissions.
4. Actions: GraphQL document in `frontend-nx/apps/edu-hub/queries/`, then
   `GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo`, role-aware
   hooks, and `messageKey` translations in `de.json` (Du) and `en.json`.
5. Tests next to the handler (`__tests__/`); run `npm test` in
   `functions/callNodeFunction` (includes the registry test against the
   metadata) or `python -m pytest __tests__` in
   `functions/callPythonFunction`.

## Response Contract

- Body `{ success, messageKey, error?, ...fields }`; failures are 200 with
  `success: false`.
- `retryable: true` makes an event/cron delivery answer 503 so Hasura
  retries; the side effect must be idempotent.
- Dispatchers answer 401 (secret), 404 (unknown function), 500 (server
  secret unset), and Node 400 when `Function-Name` and legacy `name` differ.
