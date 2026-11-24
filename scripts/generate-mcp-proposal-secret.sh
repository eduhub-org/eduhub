#!/usr/bin/env bash
# Generate the HMAC key that signs the EduHub MCP server's Proposed Changes
# between propose and apply (MCP_PROPOSAL_SECRET, see
# frontend-nx/apps/edu-hub/lib/mcp/proposals.ts and ADR 0006).
#
# Usage:
#   scripts/generate-mcp-proposal-secret.sh              # print a new key
#   scripts/generate-mcp-proposal-secret.sh --env        # write it to ./.env
#   scripts/generate-mcp-proposal-secret.sh --tfc        # set it in Terraform Cloud
#   scripts/generate-mcp-proposal-secret.sh --tfc --rotate
#
# --tfc sets the sensitive Terraform variable `mcp_proposal_secret` in the
# variable set `eduhub-application`, which staging and production share. The
# next infrastructure apply of each moves it into Secret Manager
# (`mcp-proposal-secret`) and Cloud Run. A workspace variable of the same name
# would override the set, so the script refuses to run while one exists. The
# key is never printed or put on a command line in that mode. The Terraform
# Cloud token is read from ~/.terraform.d/credentials.tfrc.json (`terraform
# login`) or TFE_TOKEN.
#
# An existing value is only replaced with --rotate. Rotating is cheap: it only
# invalidates Proposed Changes not yet applied (they live at most 24 hours).
set -euo pipefail

TFC_HOST="app.terraform.io"
TFC_ORG="opencampus"
VARSET_NAME="eduhub-application"
VAR_KEY="mcp_proposal_secret"
ENV_KEY="MCP_PROPOSAL_SECRET"

mode="print"
rotate=false

usage() { sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) mode="env" ;;
    --tfc) mode="tfc" ;;
    --rotate) rotate=true ;;
    -h | --help) usage 0 ;;
    *) echo "Unknown argument: $1" >&2; usage 1 ;;
  esac
  shift
done

# 32 random bytes = 256-bit key for HMAC-SHA256, hex so it is 64 characters
# (Terraform requires >= 32) and safe in .env files and JSON.
command -v openssl >/dev/null || { echo "openssl is required" >&2; exit 1; }
secret="$(openssl rand -hex 32)"
[[ ${#secret} -eq 64 ]] || { echo "Key generation failed" >&2; exit 1; }

case "$mode" in
  print)
    printf '%s\n' "$secret"
    ;;

  env)
    env_file="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.env"
    touch "$env_file"
    if grep -qE "^${ENV_KEY}=.+" "$env_file" && ! $rotate; then
      echo "${ENV_KEY} is already set in ${env_file}; pass --rotate to replace it." >&2
      exit 1
    fi
    tmp="$(mktemp)"
    grep -vE "^${ENV_KEY}=" "$env_file" >"$tmp" || true
    printf '%s=%s\n' "$ENV_KEY" "$secret" >>"$tmp"
    cat "$tmp" >"$env_file" && rm -f "$tmp"
    echo "Wrote ${ENV_KEY} to ${env_file}. Recreate the frontend to pick it up:"
    echo "  docker compose up -d frontend-nx"
    ;;

  tfc)
    command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
    command -v curl >/dev/null || { echo "curl is required" >&2; exit 1; }

    token="${TFE_TOKEN:-}"
    if [[ -z "$token" && -f "$HOME/.terraform.d/credentials.tfrc.json" ]]; then
      token="$(jq -r --arg h "$TFC_HOST" '.credentials[$h].token // empty' \
        "$HOME/.terraform.d/credentials.tfrc.json")"
    fi
    [[ -n "$token" ]] || { echo "No Terraform Cloud token: run 'terraform login' or set TFE_TOKEN." >&2; exit 1; }

    # Token and key go through stdin / process substitution, never argv.
    api() { # api METHOD PATH [curl args, e.g. --data-binary @-]
      local method="$1" path="$2"
      shift 2
      curl -sS --fail-with-body -X "$method" \
        -H @<(printf 'Authorization: Bearer %s\nContent-Type: application/vnd.api+json\n' "$token") \
        "https://${TFC_HOST}/api/v2${path}" "$@"
    }

    varset="$(api GET "/organizations/${TFC_ORG}/varsets?q=${VARSET_NAME}&page%5Bsize%5D=100" |
      jq -c --arg n "$VARSET_NAME" '.data[] | select(.attributes.name == $n)')"
    varset_id="$(jq -r '.id // empty' <<<"$varset")"
    [[ "$varset_id" == varset-* ]] || { echo "Variable set ${VARSET_NAME} not found" >&2; exit 1; }

    # A workspace variable wins over the set, so the set's value would be ignored.
    for ws_id in $(jq -r '.relationships.workspaces.data[].id' <<<"$varset"); do
      if api GET "/workspaces/${ws_id}/vars?page%5Bsize%5D=100" |
        jq -e --arg k "$VAR_KEY" 'any(.data[]; .attributes.key == $k and .attributes.category == "terraform")' >/dev/null; then
        echo "Workspace ${ws_id} has its own ${VAR_KEY}, which overrides ${VARSET_NAME}; delete it first." >&2
        exit 1
      fi
    done

    var_id="$(api GET "/varsets/${varset_id}/relationships/vars?page%5Bsize%5D=100" |
      jq -r --arg k "$VAR_KEY" '.data[] | select(.attributes.key == $k and .attributes.category == "terraform") | .id')"

    if [[ -n "$var_id" ]]; then
      if ! $rotate; then
        echo "${VAR_KEY} already exists in ${VARSET_NAME}; pass --rotate to replace it." >&2
        exit 1
      fi
      jq -n --arg id "$var_id" --arg v "$secret" \
        '{data: {type: "vars", id: $id, attributes: {value: $v, sensitive: true}}}' |
        api PATCH "/varsets/${varset_id}/relationships/vars/${var_id}" --data-binary @- >/dev/null
      echo "Rotated ${VAR_KEY} in ${VARSET_NAME}."
    else
      jq -n --arg k "$VAR_KEY" --arg v "$secret" \
        '{data: {type: "vars", attributes: {key: $k, value: $v, category: "terraform", hcl: false, sensitive: true,
          description: "HMAC key signing the EduHub MCP server'"'"'s Proposed Changes between propose and apply"}}}' |
        api POST "/varsets/${varset_id}/relationships/vars" --data-binary @- >/dev/null
      echo "Created sensitive ${VAR_KEY} in ${VARSET_NAME} (${#secret} characters)."
    fi
    echo "It takes effect with the next staging and production infrastructure apply."
    ;;
esac
