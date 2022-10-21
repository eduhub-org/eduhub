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

# Step 1: Files and Config

1.  Create two files in eud-hup root directory.

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

1.  Ask for the configs of for the file `frontend.env`. Content looks like following:

        STORAGE_BUCKET_URL=""

1.  Ask for the conent of the folder `backend/seeds/default` and put them.
1.  Also need the conent of the folder `keycloak/imports/`

# Step 2: Environment Setup

1.  Install `docker` (if not installed already).

        sh docker_install.sh

1.  [Mangae docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)

1.  Install docker-compose (atlest version 1.29.2). Follow the [link](https://docs.docker.com/compose/install/) to install.

1.  There is a docker-compose.yml which you can use to start edu-hub with some settings for development. Run the following command to start all the containers as necessary. The frontend container will not yet do anything, but it will mount `./frontend` as a volume and open it as the working directory `/opt/app`. Run the command below.

        docker-compose up

1.  Open another `Terminal` (or tab)

1.  Hasura: Install hasura-cli (if not exists)

        npm install --global hasura-cli

1.  Run the following command inside.

        $ cd backend
        $ HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey hasura seed apply

1.  Check hasura is running by following command.

        hasura console

1.  Keycloak imports: (it will error out with address in use in the end, which is fine)

        docker exec -it edu-hub_keycloak_1 /opt/keycloak/bin/kc.sh import --realm edu-hub --dir "/imports"

    - If you get following error. Delete all **edu_hub** images from docker (`docker image rm image-name`) and run docker (`docker-compose up`) images again. [Help!](https://www.digitalocean.com/community/tutorials/how-to-remove-docker-images-containers-and-volumes)

      _OCI runtime exec failed: exec failed: unable to start container process: exec: "/opt/keycloak/bin/kc.sh": stat /opt/keycloak/bin/kc.sh: no such file or directory: unknown_

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

1.  docker-compose down
1.  docker-compose up

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
