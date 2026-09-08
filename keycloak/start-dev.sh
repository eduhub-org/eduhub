#!/bin/sh
set -eu

dev_host=${DEV_HOST:-localhost}
ssl_required=${DEV_KEYCLOAK_SSL_REQUIRED:-external}

if ! printf '%s' "$dev_host" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9.-]*$'; then
  echo "DEV_HOST must be a hostname or IPv4 address (received: $dev_host)" >&2
  exit 1
fi

case "$ssl_required" in
  external|none) ;;
  *)
    echo "DEV_KEYCLOAK_SSL_REQUIRED must be external or none" >&2
    exit 1
    ;;
esac

# Keep the checked-in realm directly importable/exportable. Preview-only values
# are applied to a temporary copy and never written back to the repository.
sed \
  -e "s/\"sslRequired\": \"external\"/\"sslRequired\": \"$ssl_required\"/" \
  -e "s#\"http://localhost:5001/\\*\"#\"http://localhost:5001/*\",\n        \"http://$dev_host:5000/*\",\n        \"http://$dev_host:5001/*\"#" \
  /opt/keycloak/data/import/edu-hub.json \
  > /tmp/edu-hub.json

unset KC_BOOTSTRAP_ADMIN_USERNAME KC_BOOTSTRAP_ADMIN_PASSWORD
/opt/keycloak/bin/kc.sh import --optimized \
  --file /opt/keycloak/data/import/master.json \
  --override true
/opt/keycloak/bin/kc.sh import --optimized \
  --file /tmp/edu-hub.json \
  --override false

exec /opt/keycloak/bin/kc.sh start --optimized \
  --spi-theme-cache-themes=false \
  --spi-theme-cache-templates=false
