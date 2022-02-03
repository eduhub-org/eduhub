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

Then open a shell in the frontend container via `docker exec -it edu-hub_frontend_1 /bin/sh`. You can then run `yarn` to install dependencies and `yarn dev` to start the
development server.

Now you can modify code in this project and it should automatically reload changes.

Access the website in development under `http://localhost:25000/`.
Further you can access the hasura console under `http://localhost:8080/` with the secret `myadminsecretkey`.
To make login possible you will need to connect to `http://localhost:28080/auth/admin/` and login as `admin`/`admin`.
There you need to:
- Allow user registrations for edu-hub
- For client "hasura" you need to set `http://localhost*` as a Valid redirect URI
- For client "hasura" you need to set `http://localhost:25000` as a Web Origin.

Now you should be able to register a user and login.

# Seed setup.

Put your seed file into backend/seeds/default.
Run `HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey hasura seed apply`
For this you need the hasura cli installed on your host system.


