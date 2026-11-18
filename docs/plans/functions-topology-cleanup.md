# Functions topology cleanup (one release after the split)

Phase 6 split callNodeFunction into `callNodeFunction`, `identity` and
`media` and folded `addKeycloakRole`, `removeKeycloakRole`,
`updateFromKeycloak` and `sendQuestionaires` into the dispatchers
(`docs/adr/0002-function-units-by-secret-scope.md`). For one release some old
paths stay, so that a Hasura revision still on the old metadata during the
rollout, and event retries already queued against the old URLs, still work:

- the four old units stay deployed (no Hasura entry calls them any more);
- `callNodeFunction` still routes the 16 handlers that moved to identity and
  media (`movedHandlers` in `functions/callNodeFunction/index.js`), so it
  keeps the Keycloak and Matrix secrets.

Remove them in the release after the split, once the gate holds.

## Gate

- [ ] The split is deployed to production: the production pipeline for that
      release finished green, Hasura's environment has
      `CLOUD_FUNCTION_LINK_IDENTITY` and `CLOUD_FUNCTION_LINK_MEDIA`, and the
      production metadata calls no `CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE`,
      `_REMOVE_KEYCLOAK_ROLE`, `_UPDATE_FROM_KEYCLOAK` or
      `_SEND_QUESTIONAIRES`.
- [ ] No pending or retrying events for the old URLs: in the Hasura console
      (Events), `add_keycloak_instructor_role`, `add_keycloak_org_admin_role`
      and `remove_keycloak_org_admin_role` have no pending deliveries older
      than the deploy.
- [ ] For at least a week, the old units' logs show no requests, and
      callNodeFunction's logs show no "Executing function" for a moved
      handler (`unit: "callNodeFunction"` with one of the 16 names):

      ```bash
      gcloud logging read 'resource.type="cloud_run_revision"
        AND resource.labels.service_name=("add-keycloak-role"
          OR "remove-keycloak-role" OR "update-from-keycloak"
          OR "send-questionaires")' --freshness=7d --limit=5
      ```

## Code

- [ ] `functions/callNodeFunction/index.js`: remove `movedHandlers` and
      build `callNodeFunction` from `callNodeFunctionHandlers` alone; drop
      the `movedHandlers` test in `__tests__/registry.test.js` and the
      callNodeFunction cases in `__tests__/entryPoints.test.js` (they become
      404 cases).
- [ ] Delete `functions/addKeycloakRole`, `functions/removeKeycloakRole`,
      `functions/updateFromKeycloak`, `functions/sendQuestionaires` and their
      `functions/units.json` entries.
- [ ] `.github/dependabot.yml`: drop the four unit directories.
- [ ] `docker-compose.yml`: drop `CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE`,
      `_REMOVE_KEYCLOAK_ROLE`, `_UPDATE_FROM_KEYCLOAK`, `_SEND_QUESTIONAIRES`.
- [ ] `lib/keycloakClientRole.js`: its comment refers to the
      addKeycloakRole webhook; reword.

## Terraform (`infrastructure/application`)

- [ ] `06_cloud-functions.tf`: remove the `add_keycloak_role`,
      `remove_keycloak_role`, `update_from_keycloak` and `send_questionaires`
      units (this destroys the four functions, their invoker policies,
      service accounts and grants).
- [ ] `06_cloud-functions.tf`: remove `KEYCLOAK_*`, `MATRIX_*`, `KEYCLOAK_PW`,
      `MATRIX_ADMIN_ACCESS_TOKEN` and `MATRIX_SYNAPSE_ADMIN_TOKEN` from the
      `call_node_function` unit, and the shared account's
      `call_node_function_keycloak_pw`, `..._matrix_admin_access_token` and
      `..._matrix_synapse_admin_token` grants (no other unit on the shared
      account reads them).
- [ ] `05_hasura.tf`: drop `CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE`,
      `_REMOVE_KEYCLOAK_ROLE`, `_UPDATE_FROM_KEYCLOAK`, `_SEND_QUESTIONAIRES`.
- [ ] Delete `06_cloud-functions-moved.tf` once staging and production have
      applied it (the `moved` and `removed` blocks are no-ops after that).
- [ ] Consider: the default compute account's `formbricks_api_key` grant in
      `01_secrets.tf` has no reader (no Cloud Run service sets
      FORMBRICKS_API_KEY; callNodeFunction reads it through the shared
      account).
- [ ] Zips: stop uploading `addKeycloakRole.zip`, `removeKeycloakRole.zip`,
      `updateFromKeycloak.zip`, `sendQuestionaires.zip` (follows from
      `units.json`); delete the objects from the bucket after the apply.

## Verification

- [ ] `npm test` in `functions/callNodeFunction` (registry test green).
- [ ] Staging `terraform plan`: only the four old functions and their IAM,
      service accounts and grants destroyed; callNodeFunction updated in
      place (fewer secrets); nothing else.
- [ ] Staging smoke test: login (`updateFromKeycloak`), instructor role
      add/remove, image upload, account deletion.
- [ ] Docs: the units table in `docs/SERVERLESS_FUNCTIONS.md`.
