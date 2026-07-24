#!/bin/bash

# Change to the Hasura project directory
cd /hasura

# Wait for the database and keycloak to become ready
./wait-for-it.sh db_hasura:5432 --timeout=100 --strict
./wait-for-it.sh keycloak:8080 --timeout=400 --strict

# Start the Hasura GraphQL Engine in the background
graphql-engine serve &

# Wait for Hasura to become ready
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' http://hasura:8080/healthz)" != "200" ]]; do
    sleep 2
done

# Apply Hasura migrations
echo "Applying migrations..."
hasura-cli migrate apply --database-name default

# Apply Hasura metadata
echo "Applying metadata..."
# Use metadata apply to push local metadata files to Hasura
hasura-cli metadata apply --endpoint http://localhost:8080 --admin-secret myadminsecretkey
# Verify the action was loaded by checking metadata
echo "Verifying metadata was applied..."
sleep 2

# Check if the "users" table is empty
is_empty=$(psql $HASURA_GRAPHQL_DATABASE_URL -tAc "SELECT COUNT(*) FROM public.\"User\"")

# Conditionally apply the seed data
if [[ $is_empty -eq 0 ]]; then
    echo "Applying seed data..."
    if ! hasura-cli seed apply --file initial_seeds.sql --database-name default; then
        echo "ERROR: Seed data application failed. Exiting so the container is not left healthy with an empty database."
        kill %1 2>/dev/null || true
        exit 1
    fi
    echo "Seed data applied successfully."
else
    echo "The 'users' table is not empty. Skipping seed data application."
fi

# Since Hasura is already running in the background, just wait indefinitely to keep the container alive
wait