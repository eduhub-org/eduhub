#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

# Must match matrix/synapse/homeserver.yaml and matrix/mas/config.yaml.
HOMESERVER_URL="http://localhost:8008" # matrix_proxy, as seen from the host
SERVER_NAME="localhost"
BOT_LOCALPART="eduhub-bot"
ADMIN_LOCALPART="synapse-admin"
MAIN_SPACE_ALIAS_LOCALPART="eduhub-main"

usage() {
  cat <<'EOF'
Usage:
  scripts/matrix-dev-setup.sh

Prepares the local Matrix stack for EduHub development. Start it first:

  docker compose --profile matrix up -d

Then this script, which is safe to run again at any time:
  1. gives every local Keycloak user a matrix_user_handle (needed after each
     Keycloak recreate, because the dev realm is re-imported without them)
  2. registers the EduHub bot and a Synapse admin in MAS
  3. issues their access tokens, unless the ones in .env still work
  4. creates the main space "EduHub (lokal)" if it does not exist
  5. writes the Matrix variables into .env and restarts the services using them

Tokens are only written to .env (gitignored), never printed.
EOF
}

check_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

compose() {
  docker compose -f "$ROOT_DIR/docker-compose.yml" --profile matrix "$@"
}

mas_cli() {
  compose exec -T mas /usr/local/bin/mas-cli "$@" --config=/config/config.yaml
}

wait_for() {
  local url="$1" name="$2" attempt
  for attempt in $(seq 1 60); do
    if [[ "$(curl -s -o /dev/null -w '%{http_code}' "$url")" == "200" ]]; then
      return 0
    fi
    sleep 2
  done
  echo "Error: $name is not reachable at $url. Is 'docker compose --profile matrix up -d' running?" >&2
  exit 1
}

get_env() {
  grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- || true
}

set_env() {
  local key="$1" value="$2" tmp
  if grep -qE "^$key=" "$ENV_FILE"; then
    tmp="$(mktemp)"
    KEY="$key" VALUE="$value" awk '
      index($0, ENVIRON["KEY"] "=") == 1 { print ENVIRON["KEY"] "=" ENVIRON["VALUE"]; next }
      { print }
    ' "$ENV_FILE" >"$tmp"
    cat "$tmp" >"$ENV_FILE"
    rm -f "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

# True if $1 is a working access token for the Matrix user $2.
token_belongs_to() {
  local token="$1" user_id="$2"
  [[ -n "$token" ]] || return 1
  curl -s -H "Authorization: Bearer $token" "$HOMESERVER_URL/_matrix/client/v3/account/whoami" |
    grep -q "\"user_id\":\"$user_id\""
}

ensure_mas_user() {
  local localpart="$1" admin_flag="$2" display_name="$3" output
  if output="$(mas_cli manage register-user -y "$admin_flag" -d "$display_name" "$localpart" 2>&1)"; then
    echo "  registered @$localpart:$SERVER_NAME"
  elif grep -q "already exists" <<<"$output"; then
    echo "  @$localpart:$SERVER_NAME already exists"
  else
    echo "$output" >&2
    exit 1
  fi
}

# Keeps the token in .env if it still works, otherwise issues a new one.
ensure_token() {
  local env_key="$1" localpart="$2" device_id="$3"
  shift 3
  local user_id="@$localpart:$SERVER_NAME" token
  if token_belongs_to "$(get_env "$env_key")" "$user_id"; then
    echo "  $env_key still valid"
    return
  fi
  token="$(mas_cli manage issue-compatibility-token "$@" "$localpart" "$device_id" 2>&1 |
    grep -o 'mct_[A-Za-z0-9_]*' | head -n 1)"
  if ! token_belongs_to "$token" "$user_id"; then
    echo "Error: could not issue a working token for $user_id" >&2
    exit 1
  fi
  set_env "$env_key" "$token"
  echo "  $env_key issued"
}

ensure_main_space() {
  local token alias response room_id
  token="$(get_env MATRIX_ADMIN_ACCESS_TOKEN)"
  alias="%23$MAIN_SPACE_ALIAS_LOCALPART%3A$SERVER_NAME"
  response="$(curl -s -H "Authorization: Bearer $token" \
    "$HOMESERVER_URL/_matrix/client/v3/directory/room/$alias")"
  room_id="$(grep -o '"room_id":"[^"]*"' <<<"$response" | cut -d'"' -f4 || true)"
  if [[ -z "$room_id" ]]; then
    response="$(curl -s -X POST -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
      "$HOMESERVER_URL/_matrix/client/v3/createRoom" \
      -d "{\"name\":\"EduHub (lokal)\",\"preset\":\"public_chat\",\"visibility\":\"private\",
           \"room_alias_name\":\"$MAIN_SPACE_ALIAS_LOCALPART\",\"creation_content\":{\"type\":\"m.space\"}}")"
    room_id="$(grep -o '"room_id":"[^"]*"' <<<"$response" | cut -d'"' -f4 || true)"
    if [[ -z "$room_id" ]]; then
      echo "Error: could not create the main space: $response" >&2
      exit 1
    fi
    echo "  created main space $room_id"
  else
    echo "  main space exists: $room_id"
  fi
  set_env MATRIX_MAIN_SPACE_ID "$room_id"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "$#" -ne 0 ]]; then
  usage >&2
  exit 1
fi

check_command docker
check_command curl

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  echo "Created .env from .env.example"
fi

echo "Waiting for Keycloak, MAS and the homeserver..."
wait_for "http://localhost:28080/realms/edu-hub/.well-known/openid-configuration" "Keycloak"
wait_for "http://localhost:8090/.well-known/openid-configuration" "MAS"
wait_for "$HOMESERVER_URL/_matrix/client/versions" "The homeserver"

echo "1. Matrix handles for local Keycloak users"
compose exec -T -w /functions/callNodeFunction \
  -e KEYCLOAK_URL=http://keycloak:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PW=admin \
  -e HASURA_ENDPOINT=http://hasura:8080/v1/graphql -e HASURA_ADMIN_SECRET=myadminsecretkey \
  -e STORAGE_BUCKET_PUBLIC_URL=http://localhost:4001/emulated-bucket \
  node_functions node scripts/backfill-matrix-handles.js | tail -n 1 | sed 's/^/  /'

echo "2. Bot and admin accounts in MAS"
ensure_mas_user "$BOT_LOCALPART" --no-admin "EduHub Bot"
ensure_mas_user "$ADMIN_LOCALPART" --admin "Synapse Admin (lokal)"

echo "3. Access tokens"
ensure_token MATRIX_ADMIN_ACCESS_TOKEN "$BOT_LOCALPART" EDUHUBFUNCTIONS
ensure_token MATRIX_SYNAPSE_ADMIN_TOKEN "$ADMIN_LOCALPART" ACCOUNTDELETION \
  --yes-i-want-to-grant-synapse-admin-privileges

echo "4. Main space"
ensure_main_space

echo "5. .env and services"
# Serverless functions run in Docker and reach Synapse directly; browsers use localhost.
set_env MATRIX_HOMESERVER_URL "http://synapse:8008"
set_env MATRIX_SERVER_NAME "$SERVER_NAME"
set_env MATRIX_ADMIN_USER_ID "@$BOT_LOCALPART:$SERVER_NAME"
set_env MATRIX_ELEMENT_CLIENT_URL "http://localhost:8088"
set_env NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL "http://localhost:8088"
set_env NEXT_PUBLIC_MATRIX_SERVER_NAME "$SERVER_NAME"
compose up -d node_functions frontend-nx 2>&1 | grep -E 'Recreated|Started' | sed 's/^/  /' || true

echo "Done. Log in to Element at http://localhost:8088 with a local EduHub user."
