#!/bin/sh

# proxy access to keycloak for nextauth
socat tcp-listen:28080,reuseaddr,fork tcp:keycloak:8080 &
# start the development server
yarn dev