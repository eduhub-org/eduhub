#!/bin/bash

# Change to the Hasura project directory
cd /hasura

# Wait for the database and keycloak to become ready
./wait-for-it.sh db_hasura:5432 --timeout=100 --strict
./wait-for-it.sh keycloak:8080 --timeout=200 --strict

# Start the Hasura GraphQL Engine in the background
graphql-engine serve &

# Wait for Hasura to become ready
while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' http://localhost:8080/healthz)" != "200" ]]; do
    sleep 2
done

# Apply Hasura migrations
echo "Applying migrations..."
hasura-cli migrate apply --database-name default

# Apply Hasura metadata
echo "Applying metadata..."
hasura-cli metadata apply

# Check if the "users" table is empty
is_empty=$(psql $HASURA_GRAPHQL_DATABASE_URL -tAc "SELECT COUNT(*) FROM public.\"User\"")

# Conditionally apply the seed data
if [[ $is_empty -eq 0 ]]; then
    echo "Applying seed data..."
    hasura-cli seed apply --file dev_seeds.sql --database-name default
else
    echo "The 'users' table is not empty. Skipping seed data application."
fi

# Since Hasura is already running in the background, just wait indefinitely to keep the container alive
wait