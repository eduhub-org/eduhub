#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="${WORKSPACE_ROOT:-/workspace}"
REQ_FILE="${WORKSPACE_ROOT}/functions/apiProxy/requirements.txt"
MARKER_DIR="${HOME}/.cache/eduhub"
MARKER_FILE="${MARKER_DIR}/api_proxy_requirements.sha256"

if [[ ! -f "${REQ_FILE}" ]]; then
  echo "requirements file not found: ${REQ_FILE}" >&2
  exit 1
fi

mkdir -p "${MARKER_DIR}"

CURRENT_HASH="$(sha256sum "${REQ_FILE}" | awk '{print $1}')"
PREVIOUS_HASH=""
if [[ -f "${MARKER_FILE}" ]]; then
  PREVIOUS_HASH="$(<"${MARKER_FILE}")"
fi

if [[ "${CURRENT_HASH}" == "${PREVIOUS_HASH}" ]]; then
  python3 -c "import pytest, jwt" >/dev/null 2>&1 && {
    echo "apiProxy Python dependencies already cached; skipping install."
    exit 0
  }
fi

echo "Installing apiProxy Python dependencies from ${REQ_FILE} ..."
python3 -m pip install --user --upgrade -r "${REQ_FILE}"
echo "${CURRENT_HASH}" > "${MARKER_FILE}"
echo "apiProxy Python dependencies installed and cache marker updated."
