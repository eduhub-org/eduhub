#!/usr/bin/env bash
#
# Run the StuJo → EduHub ETL (scripts/stujo_etl.py) against the STAGING
# environment on Google Cloud (project eduhub-staging-new).
#
# It sets the staging *target* endpoints and pulls the two staging secrets
# (Hasura admin key, Keycloak admin password) from Google Secret Manager at
# runtime, so no secrets are written to disk. The *source* side (the StuJo
# MySQL dump, the rsynced Rails public/ dir, and the Keycloak admin user) you
# provide yourself — either by exporting the vars before calling this, or via
# an untracked file at scripts/.stujo_etl_source.env (gitignored), e.g.:
#
#     STUJO_MYSQL_DSN='mysql://user:pass@127.0.0.1:3306/stujo'
#     STUJO_FILES_ROOT='/path/to/rails/public'
#     KEYCLOAK_USER='admin'
#
# Prerequisites:
#   - gcloud authenticated as a user that can read the two secrets.
#   - For real (non --dry-run) runs that touch logos/PDFs, Application Default
#     Credentials with WRITE access to gs://eduhub-staging-new. Your user only
#     has objectViewer directly, so impersonate the compute SA that owns the
#     app's files:
#       gcloud auth application-default login \
#         --impersonate-service-account=638150833190-compute@developer.gserviceaccount.com
#       gcloud auth application-default set-quota-project eduhub-staging-new
#   - Python deps: pip install --user mysql-connector-python requests google-cloud-storage
#
# All arguments are passed straight through to stujo_etl.py, e.g.:
#     scripts/stujo_etl_staging.sh --dry-run
#     scripts/stujo_etl_staging.sh --steps companies
#     scripts/stujo_etl_staging.sh --steps jobs --haw-org-id 42
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Staging target configuration (override via env if ever needed) --------
GCP_PROJECT="${STUJO_ETL_GCP_PROJECT:-eduhub-staging-new}"
export HASURA_URL="${HASURA_URL:-https://hasura-staging.opencampus.sh/v1/graphql}"
export KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak-staging.opencampus.sh}"
export KEYCLOAK_REALM="${KEYCLOAK_REALM:-edu-hub}"
export GCS_BUCKET="${GCS_BUCKET:-eduhub-staging-new}"
export KEYCLOAK_USER="${KEYCLOAK_USER:-admin}"

# ---- Optional untracked source-side config ---------------------------------
SOURCE_ENV="${STUJO_ETL_SOURCE_ENV:-${SCRIPT_DIR}/.stujo_etl_source.env}"
if [[ -f "${SOURCE_ENV}" ]]; then
  echo "Loading source config from ${SOURCE_ENV}"
  set -a
  # shellcheck disable=SC1090
  source "${SOURCE_ENV}"
  set +a
fi

# ---- Fetch staging secrets from Secret Manager (never persisted) -----------
fetch_secret() {
  local name="$1" val
  if ! val="$(gcloud secrets versions access latest --secret="${name}" --project="${GCP_PROJECT}" 2>/dev/null)"; then
    echo "ERROR: could not read secret '${name}' from project ${GCP_PROJECT}." >&2
    echo "       Check 'gcloud auth list' and that you have secretAccessor on it." >&2
    exit 1
  fi
  if [[ -z "${val}" ]]; then
    echo "ERROR: secret '${name}' is empty." >&2
    exit 1
  fi
  printf '%s' "${val}"
}

echo "Fetching staging secrets from Secret Manager (${GCP_PROJECT})…"
export HASURA_ADMIN_SECRET="$(fetch_secret hasura-graphql-admin-key)"
export KEYCLOAK_PW="$(fetch_secret keycloak-pw)"

# ---- Validate the source-side inputs ---------------------------------------
missing=()
[[ -n "${STUJO_MYSQL_DSN:-}" ]]  || missing+=("STUJO_MYSQL_DSN")
[[ -n "${STUJO_FILES_ROOT:-}" ]] || missing+=("STUJO_FILES_ROOT")
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "ERROR: missing required source variable(s): ${missing[*]}" >&2
  echo "       Export them, or put them in ${SOURCE_ENV}" >&2
  exit 1
fi

# ---- Soft pre-flight: warn if a real run has no writable ADC ---------------
is_dry_run=false
for arg in "$@"; do [[ "${arg}" == "--dry-run" ]] && is_dry_run=true; done
if [[ "${is_dry_run}" == false ]]; then
  adc_file="${CLOUDSDK_CONFIG:-${HOME}/.config/gcloud}/application_default_credentials.json"
  if [[ ! -f "${adc_file}" ]]; then
    echo "WARNING: no Application Default Credentials found at ${adc_file}." >&2
    echo "         GCS logo/PDF uploads will fail. See the header for the" >&2
    echo "         'gcloud auth application-default login --impersonate…' command." >&2
  fi
fi

# ---- Show the resolved target (no secrets) and run -------------------------
cat <<EOF
Target (staging):
  project      ${GCP_PROJECT}
  HASURA_URL   ${HASURA_URL}
  KEYCLOAK_URL ${KEYCLOAK_URL} (realm ${KEYCLOAK_REALM}, user ${KEYCLOAK_USER})
  GCS_BUCKET   ${GCS_BUCKET}
  source DSN   ${STUJO_MYSQL_DSN%%@*}@… (host hidden)
  files root   ${STUJO_FILES_ROOT}
  etl args     $*
EOF

exec python3 "${SCRIPT_DIR}/stujo_etl.py" "$@"
