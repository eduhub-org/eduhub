# Overview

| Docker     | Image                        | Ports                             |
| :--------- | :--------------------------- | :-------------------------------- |
| Next.js    | edu-plattform-mvp_frontend   | 0.0.0.0:25000->3000/tcp           |
| Hasura     | hasura/graphql-engine:v1.3.3 | 0.0.0.0:8080->8080/tcp            |
| Keycloak   | jboss/keycloak               | 8443/tcp, 0.0.0.0:28080->8080/tcp |
| Posgres DB | postgres:12                  | 5432/tcp                          |

# Development

## Backend

You need a Hasura executable in your PATH. You can use `npm install --global hasura-cli`.
More information on installing Hasura CLI: https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli.html

Start Hasura Console by running:

```
cd backend
hasura console --admin-secret myadminsecretkey
```

And visit http://localhost:9695

### Apply migrations, seeds and metadata

Go and get `exportedseed.sql` (ask somebody) and copy it to `./backend/seeds/default`.

```
cd backend
hasura migrate apply --admin-secret myadminsecretkey
hasura seeds apply --admin-secret myadminsecretkey
hasura metadata apply --admin-secret myadminsecretkey
```

## Keycloak

Go and get `staging-realm.json` (ask sombody) and copy the file to `.keycloak/`.

Keycloak UI is available at http://localhost:28080
Credentials are: admin:admin

### Create first user

Create a user: Manage -> Users -> Add user
Set password: Users -> <New user> -> Credentials

Copy User ID from Keycloak and set `AuthId` field of one row in the `Person` table in Hasura.

## Frontend

Run without docker locally:

```
cd frontend
yarn
yarn dev
```

Generate GraphQL Types:
`env HASURA_ADMIN_SECRET=myadminsecretkey yarn apollo:codegen`

`npx tailwindcss build styles/globals.css`
