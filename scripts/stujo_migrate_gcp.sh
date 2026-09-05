#!/usr/bin/env bash
#
# Run the full StuJo → EduHub STAGING migration from a GCP VM in the
# eduhub-staging-new project. Intended to run on a throwaway Debian VM whose
# attached (default compute) service account has:
#   - secretAccessor on hasura-graphql-admin-key + keycloak-pw
#   - objectAdmin on gs://eduhub-staging-new
# so no ADC login / SA impersonation is needed — GCS writes and Secret Manager
# reads use the VM's ambient credentials.
#
# It rsyncs the Rails public/ files from the prod StuJo server, opens an SSH
# tunnel to the prod MySQL, then runs the ETL steps in dependency order.
# stujo_etl.py must sit next to this script.
#
# Required env:
#   STRATO_SSH_PASS   SSH password for the prod StuJo server
# Optional env (sensible defaults below):
#   STRATO_SSH_HOST=edu@h2258571.stratoserver.net
#   HAW_ORG_ID=8            (FH_KIEL / HAW Kiel — mandate restriction target)
#   GCP_PROJECT=eduhub-staging-new
#   ETL_STEPS=companies,users,jobs,credits,students
#   DRY_RUN=1              (pass --dry-run to every ETL step; previews inserts,
#                           validates source connectivity, writes nothing)
#
# Usage on the VM:
#   export STRATO_SSH_PASS='...'
#   DRY_RUN=1 bash stujo_migrate_gcp.sh 2>&1 | tee dryrun.log   # dry run first
#   bash stujo_migrate_gcp.sh 2>&1 | tee migrate.log            # then for real
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATO_SSH_HOST="${STRATO_SSH_HOST:-edu@h2258571.stratoserver.net}"
HAW_ORG_ID="${HAW_ORG_ID:-8}"
GCP_PROJECT="${GCP_PROJECT:-eduhub-staging-new}"
ETL_STEPS="${ETL_STEPS:-companies,users,jobs,credits,students}"
FILES_ROOT="${HOME}/stujo-files/public"
# DRY_RUN=1 → append --dry-run to every ETL step (no writes to staging).
DRY_RUN_ARGS=()
if [ -n "${DRY_RUN:-}" ]; then DRY_RUN_ARGS=(--dry-run); fi
: "${STRATO_SSH_PASS:?export STRATO_SSH_PASS (prod StuJo SSH password) first}"

echo "==> Installing OS + Python dependencies"
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip rsync openssh-client >/dev/null
# Debian 12+ marks the system Python as externally managed (PEP 668); this is a
# throwaway migration VM, so install straight into the user site with
# --break-system-packages rather than standing up a venv.
pip3 install --user --quiet --break-system-packages \
  mysql-connector-python requests google-cloud-storage

# askpass so ssh/rsync authenticate non-interactively (no sshpass needed)
AP="$(mktemp)"; printf '#!/bin/sh\necho "$STRATO_SSH_PASS"\n' > "$AP"; chmod 700 "$AP"
export STRATO_SSH_PASS SSH_ASKPASS="$AP" SSH_ASKPASS_REQUIRE=force
SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20"

# Clean up the askpass helper and the MySQL tunnel on every exit path,
# including failures under `set -e`.
TUNNEL_PID=""
cleanup() {
  if [ -n "${TUNNEL_PID}" ]; then kill "${TUNNEL_PID}" 2>/dev/null || true; fi
  rm -f "${AP}"
}
trap cleanup EXIT

echo "==> Rsyncing Rails public/system (logos + job PDFs) from prod"
mkdir -p "${FILES_ROOT}/system"
setsid -w rsync -a --info=progress2 -e "ssh ${SSH_OPTS}" \
  "${STRATO_SSH_HOST}:/home/edu/stujo/public/system/logos" \
  "${STRATO_SSH_HOST}:/home/edu/stujo/public/system/jobs" \
  "${FILES_ROOT}/system/" </dev/null

echo "==> Opening SSH tunnel to prod MySQL (13306 -> 127.0.0.1:3306)"
setsid -w ssh ${SSH_OPTS} -N -L 13306:127.0.0.1:3306 -o ExitOnForwardFailure=yes \
  "${STRATO_SSH_HOST}" </dev/null &
TUNNEL_PID=$!
python3 -c "
import socket,time,sys
for _ in range(30):
    try: socket.create_connection(('127.0.0.1',13306),1).close(); sys.exit(0)
    except OSError: time.sleep(1)
sys.exit(1)
" || { echo 'ERROR: MySQL tunnel did not come up'; exit 1; }

echo "==> Reading prod DB credentials from the Rails config (keeps them out of this script)"
read_remote() { setsid -w ssh ${SSH_OPTS} "${STRATO_SSH_HOST}" "$1" </dev/null; }
DB_CFG=/home/edu/stujo/config/database.yml
DB_NAME="$(read_remote "awk '/^production:/{f=1} f&&/database:/{print \$2; exit}' ${DB_CFG}")"
DB_USER="$(read_remote "awk '/^production:/{f=1} f&&/username:/{print \$2; exit}' ${DB_CFG}")"
DB_PASS="$(read_remote "awk '/^production:/{f=1} f&&/password:/{print \$2; exit}' ${DB_CFG}")"
[ -n "${DB_NAME}" ] && [ -n "${DB_USER}" ] && [ -n "${DB_PASS}" ] \
  || { echo 'ERROR: could not read prod DB credentials from '"${DB_CFG}"; exit 1; }

echo "==> Configuring targets + fetching secrets (VM service account)"
# The targets default to STAGING but are all env-overridable, so
# stujo_migrate_prod.sh (or an ad-hoc export) can point this same runner at
# production without editing it.
export HASURA_URL="${HASURA_URL:-https://hasura-staging.opencampus.sh/v1/graphql}"
export KEYCLOAK_URL="${KEYCLOAK_URL:-https://keycloak-staging.opencampus.sh}"
export KEYCLOAK_REALM="${KEYCLOAK_REALM:-edu-hub}"
export KEYCLOAK_USER="${KEYCLOAK_USER:-admin}"
export GCS_BUCKET="${GCS_BUCKET:-eduhub-staging-new}"

# The ETL sends the Hasura admin secret and the Keycloak admin password to
# these two endpoints, and both are overridable from the environment — so a
# typo'd or cleartext override would put those credentials on the wire in the
# clear. Refuse before any secret is fetched, let alone sent.
for endpoint in "${HASURA_URL}" "${KEYCLOAK_URL}"; do
  case "${endpoint}" in
    https://*) ;;
    *) echo "ERROR: refusing to send credentials to a non-HTTPS endpoint: ${endpoint}" >&2; exit 1 ;;
  esac
done

export STUJO_MYSQL_DSN="mysql://${DB_USER}:${DB_PASS}@127.0.0.1:13306/${DB_NAME}"
export STUJO_FILES_ROOT="${FILES_ROOT}"
HASURA_ADMIN_SECRET="$(gcloud secrets versions access latest --secret=hasura-graphql-admin-key --project="${GCP_PROJECT}")"
KEYCLOAK_PW="$(gcloud secrets versions access latest --secret=keycloak-pw --project="${GCP_PROJECT}")"
[ -n "${HASURA_ADMIN_SECRET}" ] && [ -n "${KEYCLOAK_PW}" ] \
  || { echo 'ERROR: could not fetch the secrets from Secret Manager'; exit 1; }
export HASURA_ADMIN_SECRET KEYCLOAK_PW

echo "==================================================================="
echo "==> RUNNING ETL STEPS: ${ETL_STEPS}${DRY_RUN:+ [DRY RUN]}   ($(date -u +%H:%M:%S) UTC)"
echo "==================================================================="
# Run ALL requested steps in ONE python process. main() passes the rails-id →
# new-id mappings between steps in memory (companies→org_mapping→users, then
# users→user_mapping→jobs, etc.). Running each step as a separate process
# leaves those mappings empty, so users/jobs/credits silently no-op — hence a
# single invocation. --haw-org-id only affects the jobs step; harmless
# otherwise. `companies` must be included so org_mapping is rebuilt in memory
# (idempotent: existing orgs are matched by their stujo: alias, not re-created).
python3 "${SCRIPT_DIR}/stujo_etl.py" --steps "${ETL_STEPS}" \
  --haw-org-id "${HAW_ORG_ID}" "${DRY_RUN_ARGS[@]}"

echo "==> DONE (tunnel closed by exit trap)"
