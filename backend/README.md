# Hasura Console
The default hasura console is deactivated because it does not support migrations. For local development you have to install the Hasura CLI:
```
https://hasura.io/docs/1.0/graphql/core/hasura-cli/install-hasura-cli.html#install-hasura-cli
```
Once installed you can start up the console via terminal from the project directory (../edu-playttform/backend/) by running
```
hasura console
```
It will open the browser window and you can use it as usual.

# Migrations
You can load up existing Migrations via terminal from the project directory (../edu-playttform/backend/) to your local Hasura instance by running:
```
hasura migrate apply
```

# Metadata
You can load up existing Metadata via terminal from the project directory (../edu-playttform/backend/) to your local Hasura instance by running:
```
hasura metadata apply
```

# Doku used
```
https://hasura.io/docs/1.0/graphql/core/migrations/migrations-setup.html
```
