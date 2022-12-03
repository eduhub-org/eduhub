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

# Development Setup

1.  Install docker if not installed. You can use the script file to install docker.

        sh docker_install.sh

1.  It is recommended you setup rootless docker commands, so you dont need to sudo docker.

1.  Install docker-compose (atlest version 1.29.2). Follow the [link](https://docs.docker.com/compose/install/) to install.

1.  Create an empty file in edu-hub root directory called `hasura_keycloak.env`

        touch hasura_keycloak.env

1.  Fill the hasura_keycloak.env with the HASURA_CLOUD_FUNCTION_SECRET and HASURA_BUCKET. These are private values not part of the public github, you need to ask somebody in the know about them, or use your own cloud functions servers.

1.  Create an empty file in edu-hub root directory called frontend.env

1.  Fill frontend.env with STORAGE_BUCKET_URL="..." You need to get the right value for this from opencampus or cclausen

1.  There is a docker-compose.yml which you can use to start edu-hub with some settings for development. Run the following command to start all the containers as necessary. The frontend container will not yet do anything, but it will mount `./frontend` as a volume and open it as the working directory `/opt/app`.

        docker-compose up

## Database seed setup.

1.  Install hasura-cli (if not exists)

        npm install --global hasura-cli

1.  Run the following command inside `./backend`. Before runing the command put your seed file into backend/seeds/default.

        HASURA_GRAPHQL_ADMIN_SECRET=myadminsecretkey hasura seed apply

1.  To start the hasura console run "hasura console" in `./backend`

## Keycloak seed

1. Put your seed files into keycloak/imports/.
   You might need to remove some or most of the user-jsons, as for me they caused some public key duplicate error. For development you don't really need all of the users anyway.
2. Run the following command:

   docker exec -it eduhub-keycloak_1 /opt/keycloak/bin/kc.sh import --dir "/imports"

3. it will error out with address in use in the end, which is fine

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

## Start/Stop

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

2.  `Hot reloading` of the frontend docker image

    - Open a docker shell for the `edu-hub_frontend_1` image via the following command

      sudo docker exec -it edu-hub_frontend_1 /bin/sh

    - Install dependencies via `yarn` (if not installed previously)

          /opt/app # yarn

    - Run the Frontend with `hot reloading`

          /opt/app # yarn dev

    - Now you can modify code in this project and it should automatically reload changes.
