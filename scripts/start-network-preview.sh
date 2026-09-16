#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <Tailscale-IPv4>" >&2
  exit 1
fi

dev_host=$1

if ! printf '%s\n' "$dev_host" | awk -F. '
  NF != 4 { exit 1 }
  {
    for (i = 1; i <= 4; i++) {
      if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1
    }
    if ($1 != 100 || $2 < 64 || $2 > 127) exit 1
  }
'; then
  echo "Preview host must be a Tailscale IPv4 address (received: $dev_host)" >&2
  exit 1
fi

if command -v ip >/dev/null 2>&1; then
  local_ipv4_addresses=$(ip -o -4 addr show | awk '{ split($4, a, "/"); print a[1] }')
elif command -v ifconfig >/dev/null 2>&1; then
  local_ipv4_addresses=$(ifconfig | awk '$1 == "inet" { print $2 }')
else
  echo "Could not inspect this machine's network interfaces." >&2
  exit 1
fi

if ! printf '%s\n' "$local_ipv4_addresses" | grep -Fqx "$dev_host"; then
  echo "Preview host is not assigned to this machine: $dev_host" >&2
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
