# Edu-Hub local development

Edu-Hub uses docker-compose to support full local development that does not depend on any external servers or secret database seeds anymore.

## Requirements for the host machine

Initial development of the full docker based development environment happened on Ubuntu 20.04, but it should work on any OS that can provide these:

- docker, see this script: bin/docker_install.sh
- docker-compose version 1.29.2 or up, see [here](https://docs.docker.com/engine/install/ubuntu/#set-up-the-repository)
- Recommend: [Manage docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)
- Optional to capture database migrations: **hasura console**, running hasura console from inside the containers and have it manage migrations is [hard](https://github.com/hasura/graphql-engine/issues/2824), so you need to run the console from outside to create migrations. If you do not need migrations you can enable the console from inside the containers in the docker-compose.yml, see [here](https://www.npmjs.com/package/hasura-cli).

## Getting started quickly

1. Make sure you provide the necessary requirements
1. **docker-compose up**
1. Initial startup might take a moment to run npm install on the serverless functions
1. Once startup is completed navigate to localhost:5000 and login as **dev@example.com** with password **dev**
1. Keycloak can be accessed on localhost:28080 as **admin**, password is **admin**

## Useful commands

- docker-compose up -d to bring up the dev environemt
- docker-compose stop to stop the dev environment, but keep the local data
- docker-compose start to start the dev environment after a stop
- docker-compose down -v to bring down the dev environment and delete all local data

## Ports

The following ports on the local machine are relevant

- Port 4001 serves the files uploaded by the various serverless functions, during local development there is no concept of private links, all files can be directly accessed. This is because local development does not use google cloud buckets.
- Port 8080 provides the hasura API
- Port 5000 provides the Edu-Hub Frontend
- Port 28080 provides the keycloak admin interface, login as **admin** with password **admin**
- Port 42000 to ~420025 provide serverless functions, each function has its own port, development of serverless functions might use these directly

## Scripts

There are a few helpful scripts in **./bin**.

- regenerate-apollo.sh is used to rebuild the apollo generated code for graphql queries. Call it like this: **sudo bash regenerate-apollo.sh your_local_username**, it will handle running the apollo:codegen target and then fix the problem that generated files are generated as owned by root on your host machine. This way you will be able to push/pull the files using git without access violation errors. The containers need to be up for this.
- lint.sh runs the lint --fix command inside the frontend container. The containers need to be up for this.
- docker_install.sh can be used to install docker, though it is missing docker-compose.

## Technical details

- You can look at the logs of the running containers with **docker-compose logs -f**, or of a specific container with **docker logs edu-hub_functions_1 -f**
- If you just want to stop the containers and continue where you left off later use **docker-compose stop/start**, down would delete all local data!
- The hasura log is spammed by the JWK update, which happens once a second. This is correct hasura behavior for this setup.

## Updating the setup

- Please make sure to test if the local dev environment still works when you change anything on the project!
- If you want other data to be in the default development environment:
  1. test
  1. a

## rent-a-scientist

Rent a scientist has its own frontend, it works against the same hasura based backend as the normal edu-hub frontend.
The rent a scientist frontend is located in the directory rent-a-scientist, it is basically a copy of frontend with all unnecessary parts removed.

Start docker-compose -f rent-a-scientist-compose.yml to develop on it!

## Endpoints:

1. Frontend: `localhost:25000`

2. Hasura(GraphQL server): `localhost:9695`

   - You need to start this via the CLI: "hasura console" in ./backend

3. Keycloak(User management portal): `localhost:28080`
   - login as `admin`/`admin`.

---

# Overview

| Docker     | Image                        | Ports                             |
| :--------- | :--------------------------- | :-------------------------------- |
| Next.js    | edu-plattform-mvp_frontend   | 0.0.0.0:25000->3000/tcp           |
| Hasura     | hasura/graphql-engine:v1.3.3 | 0.0.0.0:8080->8080/tcp            |
| Keycloak   | jboss/keycloak               | 8443/tcp, 0.0.0.0:28080->8080/tcp |
| Posgres DB | postgres:12                  | 5432/tcp                          |

Follow the steps below to start your devlopment.

1.  Install docker if not installed. You can use the script file to install docker.

1.  Create two files in eud-hup root directory.

1.  It is recommended you setup rootless docker commands, so you dont need to sudo docker.

1.  Install docker-compose (atlest version 1.29.2). Follow the [link](https://docs.docker.com/compose/install/) to install.

1.  create local config files
    touch hasura_keycloak.env
    touch frontend.env

1.  Ask for the following configs and put them in the file `hasura_keycloak.env`

        HASURA_CLOUD_FUNCTION_SECRET=""
        HASURA_BUCKET=""

        STORAGE_BUCKET_URL=""
        CLOUD_FUNCTION_LINK_LOAD_FILE=""
        CLOUD_FUNCTION_LINK_SAVE_FILE=""
        CLOUD_FUNCTION_LINK_UPDATE_FROM_KEYCLOAK=""
        CLOUD_FUNCTION_LINK_SEND_MAIL=""

1.  Ask for the content of the folder `backend/seeds/default` and put them.
1.  Also need the content of the folder `keycloak/imports/`

# Step 2: Environment Setup

1.  Install `docker` (if not installed already).

        sh docker_install.sh

1.  [Manage docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)

1.  There is a docker-compose.yml which you can use to start edu-hub with some settings for development. Run the following command to start all the containers as necessary. The frontend container will not yet do anything, but it will mount `./frontend` as a volume and open it as the working directory `/opt/app`. Run the command below.

        docker-compose up

1.  Open another `Terminal` (or tab)

1.  Hasura: Install hasura-cli (if not exists)

        npm install --global hasura-cli

1.  Run the following command inside.

        $ cd backend
        $ HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey hasura seed apply

## Database seed setup.

1.  Install hasura-cli (if not exists)

        npm install --global hasura-cli

1.  Run the following command inside `./backend`. Before runing the command put your seed file into backend/seeds/default.

1.  Check hasura is running by following command.

1.  To start the hasura console run "hasura console" in `./backend`

1.  Keycloak imports: (it will error out with address in use in the end, which is fine)

        docker exec -it edu-hub_keycloak_1 /opt/keycloak/bin/kc.sh import --realm edu-hub --dir "/imports"

    - If you get following error. Delete all **edu_hub** images from docker (`docker image rm image-name`) and run docker (`docker-compose up`) images again. [Help!](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes)

      _OCI runtime exec failed: exec failed: unable to start container process: exec: "/opt/keycloak/bin/kc.sh": stat /opt/keycloak/bin/kc.sh: no such file or directory: unknown_

1.  Put your seed files into keycloak/imports/.
    You might need to remove some or most of the user-jsons, as for me they caused some public key duplicate error. For development you don't really need all of the users anyway.
1.  Run the following command:

    docker exec -it eduhub-keycloak_1 /opt/keycloak/bin/kc.sh import --dir "/imports"

1.  it will error out with address in use in the end, which is fine

## HASURA_GRAPHQL_JWT_SECRET setup

Somehow the keycloak setup with hasura just don't work and hasura will not accept the jwt produced by keycloak, unless the certificate is hardcoded into the environment properties in docker-compose.yml.

1.  Copy the public key from admin panel:

    - http://localhost:28080/
    - Navigate to `Administration Console -> Realm Settings -> Keys -> Active -> Public key (in the row RS256)`
    - Copy the key from popup

1.  Add copied key in file `hasura_keycloak.env`

    - Open the file (create if not exists, inside project root directory)
    - Add the following content inside the file

          HASURA_GRAPHQL_JWT_SECRET={"type": "RS256", "key": "-----BEGIN CERTIFICATE-----\nPUT_YOUR_PUBLIC_KEY_HERE\n-----END CERTIFICATE-----"}

    - Replace `PUT_YOUR_PUBLIC_KEY_HERE` with the copied key from step 1.
    - The file hasura_keycloak.env is in .gitignore to allow every developer to have a different value in it.

1.  docker-compose stop
1.  docker-compose start

## Create an account in keycloak.

1. Add a role `admin`, `instructor_access` and `user_access` (If not exist)

   - Click `Add Role` (Clients -> hasura -> Roles -> Add Role)
   - Role Name: `admin`
   - Save
   - Do the same for the other roles.

2. Add user (Users -> Add user)
3. Reset Password
   - Search user in `Users`
   - Click the user
   - Reset password (Credentials tab, disable `temporary`)
4. Role Mapping
   - Role Mapping tab (Users -> Role Mapping)
   - Client Roles: (hasura)
   - Assigned all the roles.

# Start/Stop docker images

1.  Docker Images

    List of Docker Images:

    - edu-hub_frontend_1
    - edu-hub_hasura_1
    - edu-hub_keycloak_1
    - edu-hub_db_hasura_1
    - edu-hub_db_keycloak_1

    Stop/Start the the images together.

         First start: sudo docker-compose -f docker-compose.yml up -d
         sudo docker-compose stop
         sudo docker-compose start

    You can track logs with docker-compose logs -f

# Helpful commands

1.  Open a docker shell for an image. Example for the image `edu-hub_frontend_1`

         sudo docker exec -it edu-hub_frontend_1 /bin/sh

1.  `Hot reloading` frontend docker image:

        sudo docker exec -it edu-hub_frontend_1 /bin/sh

        ## to Install dependencies ##

        /opt/app # yarn

        ## run fronend with hot reloading ##

        /opt/app # yarn dev

1.  Eslint (from scripts in package.json)

        yarn lint --fix

1.  Apollo Codegenerator (from scripts in package.json)

        yarn apollo:codegen

1.  Load data to docker (file name: busybox.tar.gz)

        docker load < busybox.tar.gz

# New things to keep in mind

- hasura console has to still be run from outside the containers for this reason: https://github.com/hasura/graphql-engine/issues/2824
- https://www.keycloak.org/server/importExport ./kc.sh export --file /opt/keycloak/data/import/edu-hub.json --users realm_file --realm edu-hub

# Talk to Steffen

- Problem with the nextauth callbacks: never called?
- users management is not really fully implemented, I think it is missing the ability to make a person instructor or admin? Can user creation even work at all from here? It's not like we can pass the password through hasura to keycloak?! Is user creation a necessary feature here? Why not create in keycloak? Normal students will register via keycloak as well, after all? Why do it differently for admins/instructors? Just let roles be set via eduhub?
- updateKeycloakProfile is not added to hasura, updateFromKeycloak does not insert the necessary entry into the admin table to make eduhub understand a user is an admin
- require("../lib/eduHub.js") & other code changes in the functions necessary to make them work local
- Why python serverless functions?
- How are course invitations accepted anyway? I cant find a UI for that at all.
- Problem with loadFromBucket: What path is input exactly? The full path produced by saveFromBucket would not work, as it is a full URL, not just a filename. The load\* serverless functions however seem to not contain the knowledge to build filepaths again...

# Talk to faiz

- What is that "Anwesenheit und the CourseAchievement stuff in the instructor course manage page AuthorizedManageCourse
- The database design with an extra table for course instructors makes it hard to create a course in the empty database. Not a big issue, since the database will not be empty in production, as the old data is imported into it... Still makes it awkward to create a course for a new course instructor? -> First create the course, then create the course instructor entry
- check out the new achievement functions for completion
- setup i18n for en/de, I will do the translation
- fix template-upload to show an link to the file instead
- the certificates generation button should only be displayed in the last instructor course manage tab
