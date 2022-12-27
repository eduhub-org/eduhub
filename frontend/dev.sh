#!/bin/sh

# proxy access to keycloak for nextauth
socat tcp-listen:28080,reuseaddr,fork tcp:keycloak:8080 &
# proxy access to hasura for the updateUser callback
socat tcp-listen:8080,reuseaddr,fork tcp:hasura:8080 &
# get libs
yarn
# start the development server
yarn dev