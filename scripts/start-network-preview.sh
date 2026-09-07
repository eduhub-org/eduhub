#!/bin/sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <LAN-or-Tailscale-IPv4> [docker compose up options]" >&2
  exit 1
fi

dev_host=$1
shift

if ! printf '%s\n' "$dev_host" | awk -F. '
  NF != 4 { exit 1 }
  {
    for (i = 1; i <= 4; i++) {
      if ($i !~ /^[0-9]+$/ || $i < 0 || $i > 255) exit 1
    }
  }
'; then
  echo "Preview host must be an IPv4 address (received: $dev_host)" >&2
  exit 1
fi

echo "Starting network preview at http://$dev_host:5000 and http://$dev_host:5001"
echo "Warning: development services and credentials will be reachable on $dev_host."

export DEV_BIND_ADDRESS="$dev_host"
export DEV_HOST="$dev_host"
export DEV_KEYCLOAK_SSL_REQUIRED=none

exec docker compose up "$@"
