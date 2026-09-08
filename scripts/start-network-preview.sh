#!/bin/sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <Tailscale-IPv4> [docker compose up options]" >&2
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

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate a temporary Hasura admin secret." >&2
  exit 1
fi

echo "Starting network preview at http://$dev_host:5000 and http://$dev_host:5001"
echo "Development services will be reachable only through this Tailscale address."

export DEV_BIND_ADDRESS="$dev_host"
export DEV_HOST="$dev_host"
export DEV_KEYCLOAK_SSL_REQUIRED=none
DEV_HASURA_ADMIN_SECRET=$(openssl rand -hex 32)
export DEV_HASURA_ADMIN_SECRET

exec docker compose up "$@"
