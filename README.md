# Overview

| Docker        | Image                           | Ports                             |
| :------------ | :------------------------------ | :-------------------------------- |
| Next.js       |  edu-plattform-mvp_frontend     | 0.0.0.0:25000->3000/tcp           |
| Hasura        |  hasura/graphql-engine:v1.3.3   | 0.0.0.0:8080->8080/tcp            |
| Keycloak      |  jboss/keycloak                 | 8443/tcp, 0.0.0.0:28080->8080/tcp |
| Posgres DB    |  postgres:12                    | 5432/tcp                          |

# Development Setup

There is a docker-compose-dev.yml which you can use to start edu-hub with some settings for development.

Run `docker-compose -f docker-compose-dev.yaml up -d` to start
all the containers as necessary. The frontend container will not yet do anything,
but it will mount `./frontend` as a volume and open it as the working directory `/opt/app`.


## Database seed setup.

Put your seed file into backend/seeds/default.
Run `HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey hasura seed apply` in ./backend
For this you need the hasura cli installed on your host system.

## Keycloak seed

Put your seed files into keycloak/imports/.

Run `docker exec -it edu-hub_keycloak_1 /opt/jboss/keycloak/bin/standalone.sh -Djboss.socket.binding.port-offset=100 -Dkeycloak.migration.action=import -Dkeycloak.migration.rovider=dir -Dkeycloak.migration.realmName=edu-hub -Dkeycloak.migration.dir=/imports`
after docker-compose up.

Once the import is completed you can close this process.

Somehow the keycloak setup with hasura just don't work and hasura will not accept the jwt produced by keycloak, unless the certificate is hardcoded into the environment
properties in docker-compose-dev.yml.
For this purpose create a file hasura_keycloak.env and fill it with this content:
`HASURA_GRAPHQL_JWT_SECRET={"type": "RS256", "key": "-----BEGIN CERTIFICATE-----\nPUT_YOUR_PUBLIC_KEY_HERE\n-----END CERTIFICATE-----"}`

You need to find the public rs256 key of your keycloak instance in its admin panel: edu hub realm -> keys -> rs256 public key.
The file hasura_keycloak.env is in .gitignore to allow every developer to have a different value in it.

## Create an account in keycloak.

You can create your own account in keycloak, make sure to add the role "user": edu hub realm -> users -> add new.
Then search your user and the hasura role "user". Maybe later we might also need to add an extra role "admin"?!

## Yarn dev for hot-reloading development

After you ran `docker-compose up` open a shell in the frontend container via `docker exec -it edu-hub_frontend_1 /bin/sh`. You can then run `yarn` to install dependencies and `yarn dev` to start the
development server.

Now you can modify code in this project and it should automatically reload changes.

Access the website in development under `http://localhost:25000/`.
Further you can access the hasura console under `http://localhost:8080/` with the secret `myadminsecretkey`.
Keycloak configs can be configured via `http://localhost:28080/auth/admin/` and login as `admin`/`admin`.
