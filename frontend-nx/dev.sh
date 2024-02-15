#!/bin/sh

# proxy access to keycloak for nextauth
socat tcp-listen:28080,reuseaddr,fork tcp:keycloak:8080 &
# proxy access to hasura for the updateUser callback
socat tcp-listen:8080,reuseaddr,fork tcp:hasura:8080 &
# proxy access to frontend for the refreshToken Api Route callback
socat tcp-listen:5000,reuseaddr,fork tcp:localhost:4200 &
# proxy access to rent-a-scientist frontend for the refreshToken Api Route callback
socat tcp-listen:5001,reuseaddr,fork tcp:localhost:4201 &
# proxy access to node_functions
socat tcp-listen:4001,reuseaddr,fork tcp:node_functions:4001 &
# proxy access to python_functions
socat tcp-listen:42025,reuseaddr,fork tcp:python_functions:42025 &
# make sure all libraries exist
yarn
# start the development servers for edu-hub and rent-a-scientist
npx nx run edu-hub:serve &
npx nx run rent-a-scientist:serve
