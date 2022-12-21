# Edu-Hub local development

Edu-Hub uses docker-compose to support full local development that does not depend on any external servers or secret database seeds anymore.

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
- Port 5000 provides the Edu-Hub Frontend
- Port 28080 provides the keycloak admin interface, login as **admin** with password **admin**
- Port 42000 to ~420025 provide serverless functions, each function has its own port, development of serverless functions might use these directly

## Scripts

There are a few helpful scripts.

- `regenerate-apollo.sh` is used to rebuild the apollo generated code for graphql queries. Call it like this: `sudo bash bin/regenerate-apollo.sh $USER`, it will handle running the `apollo:codegen` target and then fix the problem that generated files are generated as owned by root on your host machine. This way you will be able to push/pull the files using git without access violation errors. The containers need to be up for this. Hotreloading during development should pick up the changes, though I would not be surprised if in some situations a stop/start of the containers will be required to stabilize the setup after all those files are deleted and replaced.
- `docker_install.sh` can be used to install docker, though it is missing docker-compose.

## Technical details

- The hasura log is spammed by the JWK update, which happens once a second. This is correct hasura behavior for this setup.
- The serverless functions watch their own code, so if it is changed the function is automatically rebuild

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

# Talk to Steffen

X Problem with the nextauth callbacks: never called?

X users management is not really fully implemented, I think it is missing the ability to make a person instructor or admin? Can user creation even work at all from here? It's not like we can pass the password through hasura to keycloak?! Is user creation a necessary feature here? Why not create in keycloak? Normal students will register via keycloak as well, after all? Why do it differently for admins/instructors? Just let roles be set via eduhub?
X updateKeycloakProfile is not added to hasura, updateFromKeycloak does not insert the necessary entry into the admin table to make eduhub understand a user is an admin

- require("../lib/eduHub.js") & other code changes in the functions necessary to make them work local

- Why python serverless functions?

* How are course invitations accepted anyway? I cant find a UI for that at all.

- Problem with loadFromBucket: What path is input exactly? The full path produced by saveFromBucket would not work, as it is a full URL, not just a filename. The load\* serverless functions however seem to not contain the knowledge to build filepaths again...

# Talk to Faiz

- What is that "Anwesenheit und the CourseAchievement stuff in the instructor course manage page AuthorizedManageCourse
- The database design with an extra table for course instructors makes it hard to create a course in the empty database. Not a big issue, since the database will not be empty in production, as the old data is imported into it... Still makes it awkward to create a course for a new course instructor? -> First create the course, then create the course instructor entry
- check out the new achievement functions for completion
- setup i18n for en/de, I will do the translation
- fix template-upload to show an link to the file instead
- the certificates generation button should only be displayed in the last instructor course manage tab
