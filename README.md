# Todos

- Rent-a-Scientist hasura access is broken because of the schema changes. I've tried a little to fix it, but could not get it to work. Somehow all the graphql definitions have to be modified for it to access the right schema in the database. Either move back the tables to the public schema or figure out how to correctly modify the GraphQL in rent-a-scientist. I've excluded rent-a-scientist from the apollo rebuild script for now for this reason.
- Verify the new linter github action, it targets frontend-nx now
- Fix production builds, especially the broken import path in the serverless functions
- Make sure nobody has pending pushes that change anything in ./frontend or ./rent-a-scientist, since deleting that will cause ugly merge conflicts
- Once production builds work: Delete ./frontend, ./rent-a-scientist, remove the old frontend config from the docker-compose.yml file, only leave the new frontend-nx.
- Remember until this todo has been done there are multiple frontends running:
- Port 5000 is the new version
- Port 5001 is the rent-a-scientist frontend
- Port 5005 serves the old frontend, it is meant to be removed

# EduHub local development

EduHub uses docker-compose to support full local development that does not depend on any external servers or secret database seeds anymore.

## Requirements for the host machine

Initial development of the full docker based development environment happened on Ubuntu 20.04, but it should work on any OS that can provide these:

- docker, see this script: `bin/docker_install.sh`
- docker-compose version 1.29.2 or up, see [here](https://docs.docker.com/engine/install/ubuntu/#set-up-the-repository)
- Recommend: [Manage docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)
- Optional to capture database migrations: `hasura-cli`, running hasura console from inside the containers and have it manage migrations is [hard](https://github.com/hasura/graphql-engine/issues/2824), so you need to run the console from outside to create migrations. If you do not need migrations you can enable the console from inside the containers in the `docker-compose.yml`, see [here](https://www.npmjs.com/package/hasura-cli).

## Getting started quickly

1. Make sure you provide the necessary requirements
1. `docker-compose up`
1. Initial startup might take a moment to run npm install on the serverless functions
1. Once startup is completed navigate to `localhost:5000` and login as **dev@example.com** with password **dev**
1. Keycloak can be accessed on `localhost:28080` as **admin**, password is **admin**

## Useful commands

- `docker-compose up -d` to bring up the dev environemt
- `docker-compose stop` to stop the dev environment, but keep the local data
- `docker-compose start` to start the dev environment after a stop
- `docker-compose down -v` to bring down the dev environment and delete all local data
- `docker exec -it edu-hub_frontend_1 /bin/sh` to run a shell inside a given container
- `docker-compose logs -f` to show all logs
- `docker logs container_name -f` to show the logs of a specific container. Get container names from `docker ps -a`

## Ports

The following ports on the local machine are relevant

- Port 4001 serves the files uploaded by the various serverless functions, during local development there is no concept of private links, all files can be directly accessed. This is because local development does not use google cloud buckets.
- Port 8080 provides the hasura API
- Port 5000 provides the Edu-Hub frontend
- Port 5001 provides the rent-a-scientist frontend
- Port 28080 provides the keycloak admin interface, login as **admin** with password **admin**
- Port 42000 to ~420025 provide serverless functions, each function has its own port, development of serverless functions might use these directly

## Scripts

There are a few helpful scripts.

- `regenerate-apollo.sh` is used to rebuild the apollo generated code for graphql queries. Call it like this: `sudo bash regenerate-apollo.sh $USER` (from the root folder of the repo), it will handle running the `apollo:codegen` target and then fix the problem that generated files are generated as owned by root on your host machine. This way you will be able to push/pull the files using git without access violation errors. The containers need to be up for this. Hotreloading during development should pick up the changes, though I would not be surprised if in some situations a stop/start of the containers will be required to stabilize the setup after all those files are deleted and replaced.
- `docker_install.sh` can be used to install docker, though it is missing docker-compose.

## Technical details

- The hasura log is spammed by the JWK update, which happens once a second. This is correct hasura behavior for this setup.
- The serverless functions watch their own code, so if it is changed the function is automatically rebuild
- When adding new projects [this bug workaround](https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503) has to be used!

## Updating the setup

- Please make sure to test if the local dev environment still works when you change anything on the project!
- If you want other data to be in the default development environment:
  1. `docker exec -ti edu-hub_db_hasura_1 /bin/sh`
  1. `su postgres`
  1. `cd`
  1. `pg_dump -h localhost -U postgres postgres --inserts --no-owner > new.sql`
  1. `CTRL + D`
  1. `mv /var/lib/postgresql/new.sql /docker-entrypoint-initdb.d/0_init.sql`
  1. Your local git should highlight changes in the file `./backend/init.d/0_init.sql` now
- Updating keycloak settings. To persist changes you made to the keycloak configuration export the edu-hub realm as described in [this documentation](https://www.keycloak.org/server/importExport).
  1. `docker exec -ti edu-hub_keycloak_1 /bin/sh`
  1. `cd bin`
  1. `./kc.sh export --file /opt/keycloak/data/import/edu-hub.json --users realm_file --realm edu-hub`
  1. Your local git should highlight changes in the file `./keycloak/imports-dev/edu-hub.json` now

## frontend-nx: NX Workspace for code sharing between various frontends

The directory frontend-nx contains the nx based monorepository meant to contain all app code in the future. Midterm even serverless functions could be moved into this workspace.
See https://nx.dev/ for more general information about this buildsystem. Advantages include:

- Code of various frontends can exist in the some workspace: ./frontend-nx/app/...
- The various frontends can pull in shared code from libraries: ./frontend-nx/libs/...
- Generator commands to quickly generate new apps or libraries are available via NX

This changes however requires changes in what commands are used to build the apps and where the app code is placed.

- The default configuration starts `./frontend-nx/dev.sh`, which runs the development frontends of edu-hub and rent-a-scientist
- For production build you will need to do `npx nx run edu-hub:build` or `npx nx run rent-a-scientist:build` in `./frontend-nx`
- Generators can be called with `npx nx g ...`, see [here](https://nx.dev/plugin-features/use-code-generators).
- Then the compiled app should be under `./frontend-nx/dist/*`
- There will need to be a new Dockerfile for production builds, likely a slightly modified version of `./frontend/Dockerfile`, which uses the changed build commands and output paths.
- Or maybe even multiple ones, one per frontend.
