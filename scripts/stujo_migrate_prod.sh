#!/usr/bin/env bash
#
# Run the StuJo → EduHub migration against PRODUCTION.
#
# Thin wrapper around stujo_migrate_gcp.sh: it only sets the production target
# endpoints (all env-overridable in the shared runner) and then delegates. Run
# it the same way — on a throwaway VM in the PRODUCTION GCP project whose
# attached service account can read the two secrets and write the uploads
# bucket. All ETL args (e.g. --dry-run via DRY_RUN=1, --steps via ETL_STEPS)
# pass through.
#
# !!! THIS WRITES TO PRODUCTION Hasura / Keycloak / GCS. !!!
#
# Required env (no safe defaults — must be set explicitly):
#   GCP_PROJECT      production GCP project id (Secret Manager + GCS bucket live here)
#   GCS_BUCKET       production uploads bucket
#   HAW_ORG_ID       prod Organization.id of HAW Kiel (mandate target) — look it up,
#                    it is NOT 8 (that was the staging id)
#   STRATO_SSH_PASS  prod StuJo server SSH password
#
# Optional env (sensible prod defaults, override only if the naming differs):
#   HASURA_URL=https://hasura.opencampus.sh/v1/graphql
#   KEYCLOAK_URL=https://keycloak.opencampus.sh
#   KEYCLOAK_USER=login@opencampus.sh          (staging used "keycloak")
#   KEYCLOAK_REALM=edu-hub
#   ETL_STEPS=companies,users,jobs,credits,students
#   DRY_RUN=1                                  (preview, no writes)
#
# Confirmation: interactive runs prompt for "PROD"; non-interactive runs (e.g.
# under setsid/nohup on the VM) must pass STUJO_PROD_CONFIRM=PROD.
#
# Usage on the VM (recommended order):
#   export STRATO_SSH_PASS='...'
#   GCP_PROJECT=<prod> GCS_BUCKET=<prod-bucket> HAW_ORG_ID=<id> \
#     DRY_RUN=1 bash stujo_migrate_prod.sh 2>&1 | tee prod-dryrun.log
#   GCP_PROJECT=<prod> GCS_BUCKET=<prod-bucket> HAW_ORG_ID=<id> \
#     STUJO_PROD_CONFIRM=PROD bash stujo_migrate_prod.sh 2>&1 | tee prod-migrate.log
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Required prod-specific values (fail fast if missing) -------------------
: "${GCP_PROJECT:?set GCP_PROJECT to the PRODUCTION project id}"
: "${GCS_BUCKET:?set GCS_BUCKET to the production uploads bucket}"
: "${HAW_ORG_ID:?set HAW_ORG_ID to the prod HAW Kiel Organization.id (NOT 8 — look it up)}"
: "${STRATO_SSH_PASS:?export STRATO_SSH_PASS (prod StuJo SSH password) first}"

# ---- Production target endpoints (overridable) -----------------------------
export GCP_PROJECT GCS_BUCKET HAW_ORG_ID
export HASURA_URL="${HASURA_URL:-https://hasura.opencampus.sh/v1/graphql}"
export KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak.opencampus.sh}"
export KEYCLOAK_REALM="${KEYCLOAK_REALM:-edu-hub}"
export KEYCLOAK_USER="${KEYCLOAK_USER:-login@opencampus.sh}"

# ---- Safety confirmation ---------------------------------------------------
cat <<EOM
-------------------------------------------------------------------------------
  StuJo → EduHub migration — TARGET: PRODUCTION
    project      ${GCP_PROJECT}
    HASURA_URL   ${HASURA_URL}
    KEYCLOAK_URL ${KEYCLOAK_URL}  (user ${KEYCLOAK_USER}, realm ${KEYCLOAK_REALM})
    GCS_BUCKET   ${GCS_BUCKET}
    HAW_ORG_ID   ${HAW_ORG_ID}
    ETL steps    ${ETL_STEPS:-companies,users,jobs,credits,students}${DRY_RUN:+   [DRY RUN]}
    ETL args     $*
-------------------------------------------------------------------------------
EOM
if [ "${STUJO_PROD_CONFIRM:-}" != "PROD" ]; then
  if [ -t 0 ]; then
    read -r -p "Type 'PROD' to proceed: " STUJO_PROD_CONFIRM
  else
    echo "ERROR: refusing to run non-interactively without STUJO_PROD_CONFIRM=PROD" >&2
    exit 1
  fi
fi
[ "${STUJO_PROD_CONFIRM}" = "PROD" ] || { echo "aborted."; exit 1; }

exec bash "${SCRIPT_DIR}/stujo_migrate_gcp.sh" "$@"
