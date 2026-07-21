#!/bin/sh

# proxy access to keycloak for nextauth
socat tcp-listen:28080,reuseaddr,fork tcp:keycloak:8080 &
# proxy access to hasura for the updateUser callback
socat tcp-listen:8080,reuseaddr,fork tcp:hasura:8080 &
# proxy access to frontend for the refreshToken Api Route callback
socat tcp-listen:${DEV_SELF_PORT:-5000},reuseaddr,fork tcp:localhost:${DEV_APP_PORT:-4200} &
# proxy access to node_functions
socat tcp-listen:4001,reuseaddr,fork tcp:node_functions:4001 &
# proxy access to python_functions
socat tcp-listen:42025,reuseaddr,fork tcp:python_functions:42025 &
# make sure all libraries exist
yarn
# start the development server (DEV_APP selects the app: edu-hub or stujo)
# Force webpack: Next 16 defaults `next dev` to Turbopack, which 404s the
# Pages Router next-auth catch-all (`/api/auth/[...nextauth]`). Production
# builds already use `--webpack` for standalone output; keep dev on the same
# bundler until Turbopack handles that route correctly.
yarn next dev "apps/${DEV_APP:-edu-hub}" -p "${DEV_APP_PORT:-4200}" -H 0.0.0.0 --webpack
