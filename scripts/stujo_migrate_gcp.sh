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
#
# Usage on the VM:
#   export STRATO_SSH_PASS='...'
#   bash stujo_migrate_gcp.sh 2>&1 | tee migrate.log
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STRATO_SSH_HOST="${STRATO_SSH_HOST:-edu@h2258571.stratoserver.net}"
HAW_ORG_ID="${HAW_ORG_ID:-8}"
GCP_PROJECT="${GCP_PROJECT:-eduhub-staging-new}"
ETL_STEPS="${ETL_STEPS:-companies,users,jobs,credits,students}"
FILES_ROOT="${HOME}/stujo-files/public"
: "${STRATO_SSH_PASS:?export STRATO_SSH_PASS (prod StuJo SSH password) first}"

echo "==> Installing OS + Python dependencies"
sudo apt-get update -qq
sudo apt-get install -y -qq python3-pip rsync openssh-client >/dev/null
pip3 install --user --quiet mysql-connector-python requests google-cloud-storage

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

echo "==> Configuring staging targets + fetching secrets (VM service account)"
export HASURA_URL='https://hasura-staging.opencampus.sh/v1/graphql'
export KEYCLOAK_URL='https://keycloak-staging.opencampus.sh'
export KEYCLOAK_REALM='edu-hub'
export KEYCLOAK_USER="${KEYCLOAK_USER:-admin}"
export GCS_BUCKET='eduhub-staging-new'
export STUJO_MYSQL_DSN="mysql://${DB_USER}:${DB_PASS}@127.0.0.1:13306/${DB_NAME}"
export STUJO_FILES_ROOT="${FILES_ROOT}"
HASURA_ADMIN_SECRET="$(gcloud secrets versions access latest --secret=hasura-graphql-admin-key --project="${GCP_PROJECT}")"
KEYCLOAK_PW="$(gcloud secrets versions access latest --secret=keycloak-pw --project="${GCP_PROJECT}")"
[ -n "${HASURA_ADMIN_SECRET}" ] && [ -n "${KEYCLOAK_PW}" ] \
  || { echo 'ERROR: could not fetch staging secrets from Secret Manager'; exit 1; }
export HASURA_ADMIN_SECRET KEYCLOAK_PW

run_step() {
  local step="$1"; shift
  echo "==================================================================="
  echo "==> STEP: ${step}   ($(date -u +%H:%M:%S) UTC)"
  echo "==================================================================="
  python3 "${SCRIPT_DIR}/stujo_etl.py" --steps "${step}" "$@"
}

IFS=',' read -ra STEPS <<< "${ETL_STEPS}"
for step in "${STEPS[@]}"; do
  if [ "${step}" = "jobs" ]; then
    run_step jobs --haw-org-id "${HAW_ORG_ID}"
  else
    run_step "${step}"
  fi
done

echo "==> DONE (tunnel closed by exit trap)"
