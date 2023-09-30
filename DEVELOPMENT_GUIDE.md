# Development Guide

### Prerequisites

- Docker (See `bin/docker_install.sh` for installation)
- Docker Compose (v1.29.2+)
- Optional: `hasura-cli` for database migrations

### :whale: Docker Commands

- `docker compose up -d` - Start dev environment
- `docker compose stop` - Stop environment, keep data
- `docker compose start` Start environment after stop
- `docker compose down -v` Bring down environment and delete all containers and volumes
- `docker ps -a` - Get container names
- `docker exec -it container_name /bin/sh` - Run a shell inside a given container
- `docker compose logs -f` - Show all logs
- `docker logs container_name -f` - Show logs of a given container

### :wrench: Useful Scripts

- `regenerate-apollo.sh` - Rebuild Apollo GraphQL queries.
    - Call it as follows from the folder of the repo (Hasura must be running): `sudo bash regenerate-apollo.sh $USER`. It will handle running the `apollo:codegen` target and then fix the problem that generated files are generated as owned by root on your host machine. This way you will be able to push/pull the files using git without access violation errors. The containers need to be up for this. Hotreloading during development should pick up the changes, though I would not be surprised if in some situations a stop/start of the containers will be required to stabilize the setup after all those files are deleted and replaced.
- `docker_install.sh` - Install Docker.

### 🌱 Seeds
The seed data includes the following users:
- `admin@example.com`
- `student1@example.com`
- `student2@example.com`
- `student3@example.com`
- `student4@example.com`
- `student5@example.com`
- `expert1@example.com`
- `expert2@example.com`
- `expert3@example.com`
- `expert4@example.com`
- `expert5@example.com`
  
The password for all users is `dev`.  
To extend the seed data temporarily, use the Hasura console. To include them permantly add corresponding SQL statements to the seeds file [here](https://github.com/edu-hub-project/application/blob/develop/backend/seeds/default/dev_seeds.sql).

### Ports

- `4001` - File uploads
- `8080` - Hasura API
- `5000` - Edu frontend
- `5001` - Rent-a-scientist frontend
- `28080` - Keycloak admin interface, login as **admin** with password **admin**
- `42000` to `420025` - serverless functions (currently most functions have their own port)

## Technical details

- To access the Hasura admin frontend, change to the `backend` folder and execute `hasura console`. Changes in the database schema will be saved as migrations and can be committed correspondingly.
- For implementing a new Python serverless function consider the instructions given [here](./functions/callPythonFunction/README.md).
- The hasura log is spammed by the JWK update, which happens once a second. This is correct hasura behavior for this setup.
- The serverless functions watch their own code, so if it is changed the function is automatically rebuild
- When adding new frontend apps [this bug workaround](https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503) has to be used!
- Recommended: [Manage docker as non-root user](https://docs.docker.com/engine/install/linux-postinstall/)

### Updating the Setup

- For Keycloak settings:
To persist changes you made to the keycloak configuration export the edu-hub realm as described in [this documentation](https://www.keycloak.org/server/importExport).
  1. `docker exec -ti edu-hub_keycloak_1 /bin/sh`
  2. `cd bin`
  3. `./kc.sh export --file /opt/keycloak/data/import/edu-hub.json --users realm_file --realm edu-hub`
  4. Your local git should highlight changes in the file `./keycloak/imports-dev/edu-hub.json` now


