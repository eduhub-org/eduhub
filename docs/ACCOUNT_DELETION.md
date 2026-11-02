# Account deletion

The profile ends with a red "Delete account" section. Deletion requires a second dialog and
an exact email confirmation (case-insensitive, surrounding whitespace ignored).
Both languages warn that every certificate is permanently deleted and should
be downloaded beforehand. Successful deletion uses the existing logout flow.
The control is hidden during impersonation.

`deleteMyAccount` has no arguments. Its handler takes the identity exclusively
from Hasura's verified `session_variables`. Anonymous and missing sessions are
rejected before any database, storage or identity-provider access. The existing
`anonymizeUser(userId)` action remains admin-only; its handler also checks the
admin role. Both call the same erasure implementation.

## Cleanup audit (October 2026)

| Data | Treatment |
| --- | --- |
| User profile | Replace name/email; clear picture, external profile, matriculation number, organization reference/name, occupation, postal code, country, city, address lines, Matrix handle and anonymous survey ID; disable newsletter registration; mark DELETED |
| Course enrollments | Empty motivation letters, reset motivation rating, clear questionnaire JSON, cancellation reasons, location, billing organization and certificate URLs; cancel open enrollments; preserve completed/cancelled history |
| Certificates | Delete achievement, attendance/degree and instructor certificate files, including public files at their recorded paths; clear URLs |
| Profile images | Delete the original and matching resized WebP files |
| Attendance | Clear recorded identifiers and location; remove matching rows from cached raw session attendance, keeping other participants and a non-null cache to avoid reimport |
| Newsletters | Synchronously unsubscribe using the original email before deleting local subscription rows, including external subscriber IDs and error details. Rows never synced to Ghost (no external subscriber ID) are only deleted locally, even if the organization's Ghost configuration is incomplete |
| Matrix / Element | Deactivate the Matrix account via the Synapse admin API (`/_synapse/admin/v1/deactivate`, `erase: true`) before the handle is cleared: logs out all devices, leaves all rooms, removes display name and avatar, and hides sent messages from users who join later. Only Synapse's `M_NOT_FOUND` (never logged in) counts as done. Without any homeserver configured (local development) the step is skipped; a partial configuration fails the deletion |
| Guest tokens | Delete tokens, including the organization name snapshot |
| Job preferences | Delete job alerts and saved job postings |
| Access and authorship links | Remove organization-admin, project author/mentor and legacy achievement author/mentor links |
| MailLog | Delete messages matching the email in recipient/sender/content fields, or linked user/enrollment/instructor/speaker IDs in metadata |
| Background writes | Exclude deleted accounts from questionnaire imports; guard questionnaire writes in the mutation; skip identity sync for deleted accounts; deny profile updates on DELETED rows |
| Queued mail | Existing delivery behavior is retained: Hasura sends the original event payload, so already queued messages can still be delivered after their MailLog records are erased. A delivery-time lookup is deferred pending team discussion. |

External cleanup happens before the database transaction, preserving file paths,
the original newsletter email and the Matrix handle if it fails. Missing files count as already
deleted, so retries work. All database cleanup runs in one Hasura transaction.
Keycloak deletion is last, and a missing identity counts as already deleted.
The whole sequence has a 150-second budget (Matrix 60 s, Keycloak 15 s per call),
so it ends with the retryable partial result before the 180-second action limit.
Incomplete work returns an error and keeps the local session for retry; neither
profile nor admin UI reports partial cleanup as success.

## Retained data and boundaries

Anonymous participation/teaching history, timestamps, non-identifying statistics,
shared project content and audit references remain. Shared project assets and
organization-owned content are not erased when one contributor leaves.

Existing invoices, Stripe references/hosted documents and instructor-payment
invoice documents remain as financial records. This workflow does not implement
refunds or a financial-document retention policy.

Clearing imported questionnaire answers does not erase source data in
Formbricks, Zoom, LimeSurvey or Mailgun. Matrix deactivation cannot rewrite the
user ID (which contains the name) in messages already sent; with `erase` they
are hidden only from users who join later. Ghost is
unsubscribed, which does not guarantee provider-side member erasure. Backups,
application logs and Hasura event/action history also follow their own retention
policies. This workflow therefore covers the EduHub account and its operational
personal data, rather than claiming erasure from every external system.

Keycloak removal stops future login/refresh; an already issued JWT remains
cryptographically valid until expiry. Profile-update permissions and the sync
checks prevent the erased profile from being restored through these paths. The
Keycloak sync refuses to run when the account status cannot be read, and its
profile update only matches non-deleted rows, so a sync racing the deletion
cannot write the name and email back.

## Verification

Regression tests cover session-derived targeting, unauthorized callers, the
admin-only action, all certificate types, missing-file retries, newsletter and
storage failures, Keycloak partial failure, raw attendance preservation and
confirmation-dialog behavior. Existing mail-delivery tests remain unchanged.

Live local verification used a disposable Keycloak account and its real user
JWT. It checked anonymous/arbitrary-target rejection, certificate and image file
removal, database anonymization, cancellation, retained unrelated attendance,
Keycloak removal and stale-token profile-update denial. Fixtures were removed.

No SQL schema migration is required. Deploy the updated Node functions
(`callNodeFunction`, `updateFromKeycloak`), apply Hasura metadata and deploy the
frontend together. The shared Node function and deletion actions currently allow
180 seconds for synchronous newsletter and storage cleanup. The Cloud Function
timeout is configured in `infrastructure/application/06_cloud-functions.tf`.
Mail delivery requires no additional endpoint configuration.
Matrix deactivation uses its own token, `MATRIX_SYNAPSE_ADMIN_TOKEN`
(Terraform `matrix_synapse_admin_token`, secret `matrix-synapse-admin-token`),
of a dedicated Synapse server-admin user. The room bot
(`MATRIX_ADMIN_ACCESS_TOKEN`) stays a regular user. While Matrix is configured
but this token is unset or lacks admin rights, deletion fails at the Matrix
step before any database change and can be retried once the token is set. GraphQL types are
generated from the running schema.
