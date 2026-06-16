#!/usr/bin/env bash
set -euo pipefail

SEED_FILE="${1:-/hasura-seeds/performance/performance_degree_seed.sql}"
HASURA_SERVICE="${HASURA_SERVICE:-hasura}"

docker compose exec -T "$HASURA_SERVICE" \
  sh -c 'psql "$HASURA_GRAPHQL_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$1"' \
  sh "$SEED_FILE"
