# Functions header switch (steps 2 and 3)

Moves every Hasura entry that calls a Node unit from the legacy headers
`name` / `secret` (and lowercase `bucket`) to the standard
`Function-Name` / `Hasura-Secret` / `Bucket` that `callPythonFunction` already
uses. Contract: `docs/SERVERLESS_FUNCTIONS.md`.

Hasura metadata and the function zips deploy in separate pipeline steps, so
the switch takes three releases:

1. **Done** (`feat(functions): accept Function-Name and Hasura-Secret
   headers`): every Node unit accepts both spellings.
2. Metadata switches to the standard names (this checklist).
3. One release later, the units drop the legacy names (this checklist).

## Step 2: switch the metadata

### Gate: step 1 runs in production

Do not start until the release with step 1 is deployed to production.

- [ ] The production pipeline (`build-production-infrastructure.yml`) for that
      release finished green, including `zip_and_store_cloud_functions` and the
      Terraform apply.
- [ ] Each deployed Node unit runs the new zip. `SOURCE_SHA` on the function is
      the md5 of the zip it was built from:

      ```bash
      # units: call-node-function send-mail add-keycloak-role
      #        remove-keycloak-role update-from-keycloak send-questionaires
      gcloud functions describe call-node-function --region=$REGION \
        --format='value(buildConfig.environmentVariables.SOURCE_SHA)'
      gsutil stat gs://$PROJECT_ID/cloud-functions/callNodeFunction.zip \
        | grep 'Hash (md5)'          # base64; SOURCE_SHA is the same hash
      gsutil cat gs://$PROJECT_ID/cloud-functions/callNodeFunction.zip \
        > /tmp/cnf.zip && unzip -p /tmp/cnf.zip shared/security.js \
        | grep -c getProvidedSecret  # 1 or more
      ```

      Repeat the `unzip` check for `sendMail.zip`, `addKeycloakRole.zip`,
      `removeKeycloakRole.zip`, `updateFromKeycloak.zip`,
      `sendQuestionaires.zip`.
- [ ] Probe callNodeFunction with the new names (runs no handler):

      ```bash
      curl -s -X POST "$CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION" \
        -H "Content-Type: application/json" -d '{}' \
        -H "Hasura-Secret: $HASURA_CLOUD_FUNCTION_SECRET" \
        -H "Function-Name: headerSwitchProbe"
      ```

      New code: 404 `FUNCTION_NOT_FOUND`. Old code: 401 `MISSING_SECRET`
      (it only read `secret`).
- [ ] Replay one real action with each spelling (plan verification), e.g.
      `getSignedUrl` from the Hasura console, once as is and once with the
      headers renamed by hand.

### What changes (count: 79 + 73 + 20 header entries)

`- name: <header>` entries in `backend/metadata/`:

| File | `secret` → `Hasura-Secret` | `name` → `Function-Name` | `bucket` → `Bucket` |
|------|---:|---:|---:|
| `actions.yaml` (52 callNodeFunction actions + `updateFromKeycloak`) | 53 | 52 | 20 |
| `cron_triggers.yaml` (4 callNodeFunction crons + `send_questionaires`) | 5 | 4 | 0 |
| `databases/default/tables/public_*.yaml` (21 event triggers, 16 files) | 21 | 17 | 0 |
| **Total** | **79** | **73** | **20** |

Event triggers per file: `Course` 1, `CourseEnrollment` 2, `CourseInstructor`
4 (3 with a name), `Invoice` 1, `LocationAddress` 1, `MailLog` 1 (secret only),
`OrganizationAdmin` 2 (secret only, keep `role`), `OrganizationFeature` 1,
`OrganizationNewsletterSubscription` 1, `Project` 1, `ProjectAuthor` 1,
`RausgegangenListing` 1, `Session` 1, `SessionAddress` 1, `SessionSpeaker` 1,
`User` 1.

Every `- name: name` / `- name: secret` / `- name: bucket` line in these files
is a header (the counts match the header inventory exactly), so a line-anchored
rewrite is safe. `bucket` → `Bucket` is cosmetic (header names are
case-insensitive) but makes the metadata uniform. Other headers (`role`,
`operation`, `file-path`, `is-public`, `sizes`, `max-file-size-*`,
`allowed-file-extensions`, `mailtag`) keep their names.

### Transformation

```bash
cd backend/metadata
files=(actions.yaml cron_triggers.yaml databases/default/tables/*.yaml)
count() { grep -hEc "^\s*- name: $1\s*$" "${files[@]}" | paste -sd+ | bc; }
[ "$(count secret)" = 79 ] && [ "$(count name)" = 73 ] && [ "$(count bucket)" = 20 ] \
  || { echo "counts changed, re-check the inventory"; exit 1; }
sed -i -E \
  -e 's/^(\s*)- name: secret\s*$/\1- name: Hasura-Secret/' \
  -e 's/^(\s*)- name: name\s*$/\1- name: Function-Name/' \
  -e 's/^(\s*)- name: bucket\s*$/\1- name: Bucket/' \
  "${files[@]}"
[ "$(count secret)$(count name)$(count bucket)" = 000 ]
[ "$(count Hasura-Secret)" = 93 ] && [ "$(count Function-Name)" = 87 ] \
  && [ "$(count Bucket)" = 23 ]   # 79+14, 73+14, 20+3 already standard
```

If a handler was added since, the count check fails: update the table above
first. Also:

- [ ] Remove the header remark in the `send_pending_job_posting_mails` comment
      in `cron_triggers.yaml`.
- [ ] Tighten `functions/callNodeFunction/__tests__/registry.test.js`: drop
      `'name'` from `NAME_HEADERS` and add a test that no metadata entry calling
      a Node unit sends `name` or `secret`, so nothing regresses.

### Verification

- [ ] `npm test` in `functions/callNodeFunction` (registry test resolves all
      entries through `Function-Name`).
- [ ] YAML parses; `docker compose exec hasura hasura-cli metadata apply`
      reports no inconsistency.
- [ ] Local smoke (`docker compose up`): `saveCourseImage` (action, `Bucket`),
      `loadParticipationData` (Python, unchanged), an enrollment status change
      (event → `sendEnrollmentEmail` → MailLog → `sendMail`), instructor
      add/remove (Keycloak role units), `send_session_reminders` invoked from
      the console (cron).
- [ ] In the node_functions log (`ENVIRONMENT=development`, debug level),
      "Request header names" shows `functionNameHeader: "function-name"` and
      `secretHeader: "hasura-secret"`. Production logs at info, so check
      staging the same way after the promotion.
- [ ] Commit as `chore(metadata): send Function-Name and Hasura-Secret`.

## Step 3: drop the legacy names (one release after step 2)

### Gate

- [ ] Step 2 is deployed to production: the production metadata
      (`hasura metadata export` or the console) has no `name` / `secret`
      header on an entry that calls a Node unit.
- [ ] Staging logs show no "Request header names" entry with
      `functionNameHeader: "name"` or `secretHeader: "secret"` for a week.

### Changes

- [ ] `functions/shared/security.js`: `getProvidedSecret` reads only
      `hasura-secret`; remove `LEGACY_SECRET_HEADER`; update
      `security.test.js`.
- [ ] `functions/callNodeFunction/lib/requestHeaders.js`: `getFunctionName`
      reads only `function-name`; remove `LEGACY_FUNCTION_NAME_HEADER` and the
      `conflict` flag.
- [ ] `functions/callNodeFunction/index.js`: remove the 400
      `CONFLICTING_FUNCTION_NAME` branch and the header-spelling debug log.
- [ ] Tests: `__tests__/dispatcher.test.js` (legacy cases become 401/404),
      `lib/__tests__/requestHeaders.test.js`,
      `sendMail/__tests__/sendMailDeliveryVariables.test.js` (requests use
      `hasura-secret`).
- [ ] Docs: the "legacy" notes in `docs/SERVERLESS_FUNCTIONS.md`,
      `.claude/commands/create-function.md`, `.codex/skills/create-function/`,
      `.cursor/skills/create-function/`, `.cursor/rules/serverless-functions.mdc`,
      `.cursor/rules/security-authentication.mdc`.
- [ ] Commit as `refactor(functions)!:` only if something outside this repo
      calls the units with the old names (nothing does today: only Hasura
      sends `HASURA_CLOUD_FUNCTION_SECRET`); otherwise `refactor(functions):`.

## Retry settings: proposal (decide before or with step 2)

Not changed yet. A retry re-delivers on any non-2xx answer, including a
timeout, so every trigger with retries must have an idempotent handler.

### Current settings

Event triggers (`retry_conf`: `num_retries` × `interval_sec`, `timeout_sec`):

| Trigger (table) | Handler | Retries × interval | Timeout | Class |
|-----------------|---------|--------------------|---------|-------|
| `send_mail` (MailLog) | sendMail unit | 10 × 3660 s | 600 | mail |
| `send_enrollment_status_email` (CourseEnrollment) | sendEnrollmentEmail | 10 × 3660 s | 600 | mail |
| `send_cancellation_request_email` (CourseEnrollment) | sendCancellationRequestEmail | 0 × 10 s | 120 | mail |
| `send_instructor_certificate_email` (CourseInstructor) | sendInstructorCertificateEmail | 10 × 3660 s | 60 | mail |
| `send_organizer_added_email` (CourseInstructor) | sendOrganizerAddedEmail | 10 × 3660 s | 60 | mail |
| `send_payment_receipt_email` (Invoice) | sendCourseUpdateEmail | 10 × 3660 s | 600 | mail |
| `send_project_status_email` (Project) | sendProjectEmail | 10 × 3660 s | 600 | mail |
| `send_project_author_email` (ProjectAuthor) | sendProjectEmail | 10 × 3660 s | 600 | mail |
| `send_speaker_added_email` (SessionSpeaker) | sendSpeakerAddedEmail | 10 × 3660 s | 60 | mail |
| `rausgegangen_*_changed` (Course, LocationAddress, RausgegangenListing, Session, SessionAddress) | syncRausgegangenEvent | 5 × 300 s | 120 | sync |
| `rausgegangen_organization_feature_removed` (OrganizationFeature) | syncRausgegangenEvent | 5 × 300 s | 120 | sync |
| `sync_organization_newsletter_subscription` | syncGhostNewsletterSubscription | 5 × 300 s | 120 | sync |
| `update_keycloak_user` (User) | updateKeycloakUser | 5 × 10 s | 60 | sync |
| `update_matrix_instructor_power_level` (CourseInstructor) | updateMatrixInstructorPowerLevel | 3 × 10 s | 60 | sync |
| `add_confirmed_user_to_mm` (CourseEnrollment) | Python add_confirmed_user_to_mm | 0 × 10 s | 60 | sync |
| `add_keycloak_instructor_role` (CourseInstructor) | addKeycloakRole unit | 0 × 10 s | 60 | role |
| `add_keycloak_org_admin_role` (OrganizationAdmin) | addKeycloakRole unit | 3 × 10 s | 60 | role |
| `remove_keycloak_org_admin_role` (OrganizationAdmin) | removeKeycloakRole unit | 3 × 10 s | 60 | role |

Cron triggers (`num_retries` × `retry_interval_seconds`, `timeout_seconds`;
all `tolerance_seconds: 21600`): `sync_mail_delivery_status` 3 × 60 s / 3699,
`send_session_reminders` 2 × 60 s / 600, every other cron 0 × 10 s / 3699
(`send_questionaires` has no `retry_conf`, so Hasura's defaults apply).

### Proposed standard per class

| Class | Retries × interval | Timeout | Reason | Changes |
|-------|--------------------|---------|--------|---------|
| mail | 10 × 3660 s | 600 | The handlers only queue MailLog rows (sendOrganizerAdded-, sendInstructorCertificate-, sendSpeakerAddedEmail opt in with `retryable` on a queue failure; the others retry only on 5xx or timeout); `sendMail` waits out a Mailgun outage for ~10 h. | timeout 60 → 600 for `send_instructor_certificate_email`, `send_organizer_added_email`, `send_speaker_added_email`; `send_cancellation_request_email` 0 × 10 s / 120 → 10 × 3660 s / 600 (its handler already dedupes through MailLog.metadata, so redelivery is safe) |
| sync | 5 × 300 s | 120 | External APIs (rausgegangen, Ghost, Keycloak, Matrix, Mattermost) recover in minutes; the handlers converge to current state, so a repeat is harmless. | `update_keycloak_user` 5 × 10 s → 5 × 300 s; `update_matrix_instructor_power_level` 3 × 10 s / 60 → 5 × 300 s / 120; `add_confirmed_user_to_mm` 0 → 5 × 300 s / 120 (check it tolerates an existing member) |
| role | 3 × 30 s | 60 | A role grant should land while the user is still waiting; add/remove are idempotent (`addKeycloakRole` resolves only still-available roles). | `add_keycloak_instructor_role` 0 → 3; all three interval 10 → 30 s |
| cron | unchanged | unchanged | Crons run again on schedule; only the two that opt in retry. | none (optionally give `send_questionaires` an explicit `retry_conf`) |

Questions for the decision: is ~10 h of mail retries still wanted, or should
mail use 6 × 1800 s (3 h) so a stale mail does not arrive the next morning?
Should `sync` keep 5 × 300 s for Keycloak user updates, which a user may be
waiting for after a profile change?
