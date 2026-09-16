#!/bin/sh
set -eu

if [ "$#" -ne 0 ]; then
  echo "Usage: $0" >&2
  exit 1
fi

if command -v tailscale >/dev/null 2>&1; then
  tailscale_command=tailscale
elif [ -x /Applications/Tailscale.app/Contents/MacOS/Tailscale ]; then
  tailscale_command=/Applications/Tailscale.app/Contents/MacOS/Tailscale
else
  echo "Tailscale CLI is required to detect this machine's preview address." >&2
  exit 1
fi

if ! dev_host=$(TAILSCALE_BE_CLI=1 "$tailscale_command" ip -4); then
  echo "Could not detect this machine's Tailscale IPv4 address." >&2
  exit 1
fi

case "$dev_host" in
  ''|*'
'*)
    echo "Expected exactly one Tailscale IPv4 address." >&2
    exit 1
    ;;
esac

if ! printf '%s\n' "$dev_host" | awk -F. '
  NF != 4 { exit 1 }
  {
    for (i = 1; i <= 4; i++) {
      if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1
    }
    if ($1 != 100 || $2 < 64 || $2 > 127) exit 1
  }
'; then
  echo "Tailscale returned an invalid IPv4 address: $dev_host" >&2
  exit 1
fi

echo "Starting network preview at http://$dev_host:5000 and http://$dev_host:5001"
echo "Development services will be reachable only through this Tailscale address."

export DEV_BIND_ADDRESS="$dev_host"
export DEV_HOST="$dev_host"
export DEV_KEYCLOAK_SSL_REQUIRED=none

print_frontend_logs() {
  preview_service=$1
  echo "Recent $preview_service logs:" >&2
  docker compose logs --no-color --tail 100 "$preview_service" >&2 || true
}

wait_for_frontend() {
  preview_service=$1
  preview_timeout=600
  preview_remaining=$preview_timeout

  echo "Waiting up to ${preview_timeout}s for $preview_service to be ready..."
  while [ "$preview_remaining" -gt 0 ]; do
    preview_container_id=$(docker compose ps -a -q "$preview_service")
    if [ -z "$preview_container_id" ]; then
      echo "$preview_service container was not created." >&2
      print_frontend_logs "$preview_service"
      return 1
    fi

    preview_container_state=$(
      docker inspect --format '{{.State.Status}} {{.State.StartedAt}}' \
        "$preview_container_id" 2>/dev/null
    ) || preview_container_state=

    if [ -n "$preview_container_state" ]; then
      set -- $preview_container_state
      preview_status=$1
      preview_started_at=$2

      if [ "$preview_status" != "running" ]; then
        echo "$preview_service exited before becoming ready." >&2
        print_frontend_logs "$preview_service"
        return 1
      fi

      if docker compose logs --no-color --since "$preview_started_at" \
        "$preview_service" 2>/dev/null | grep -Fq "Ready in"; then
        echo "$preview_service is ready."
        return 0
      fi
    fi

    sleep 2
    preview_remaining=$((preview_remaining - 2))
  done

  echo "$preview_service did not become ready within ${preview_timeout}s." >&2
  print_frontend_logs "$preview_service"
  return 1
}

docker compose up -d \
  db_hasura keycloak node_functions python_functions hasura

docker compose up -d --no-deps frontend-nx frontend-stujo
wait_for_frontend frontend-nx
wait_for_frontend frontend-stujo

echo "Network preview frontends are ready:"
echo "  EduHub: http://$dev_host:5000"
echo "  StuJo:  http://$dev_host:5001"
