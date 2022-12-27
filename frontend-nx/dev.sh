#!/bin/sh

# proxy access to keycloak for nextauth
socat tcp-listen:28080,reuseaddr,fork tcp:keycloak:8080 &
# proxy access to hasura for the updateUser callback
socat tcp-listen:8080,reuseaddr,fork tcp:hasura:8080 &
# make sure all libraries exist
yarn
# start the development servers for edu-hub and rent-a-scientist
npx nx run edu-hub:serve &
npx nx run rent-a-scientist:serve