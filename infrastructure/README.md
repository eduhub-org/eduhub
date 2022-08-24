# Deploying the Application on Google Cloud

To setup the infrastructure and deploy the EduHub applications, the following main parts are needed:

- two terraform workspaces connected to two folders with terraform scripts that manage the infrastructure (and partially also the deployment of the application)
- different yml files for GitHub actions that are triggered on pull requests to deploy new versions of the application on merges from pull requests
- four folders including the dockerfiles and code for the applications. Currently the following four applications are hosted:
    - [Keycloak](https://www.keycloak.org/) (Open Source Identity and Access Management)
    - [Hasura](https://hasura.io/) (GraphQL Server)
    - EduHub (React frontend application)
    - Rent-a-Scientist (React frontend application)

Further, several serverless functions are implemented and hosted as part of the overall application. Beyond the serverless functions, Hasura and Keycloak, no additional backend code is implemented.

A prerequisite to use the given infrastructure code is access to a [Google Cloud](https://cloud.google.com) account, a [Terraform Cloud](https://cloud.hashicorp.com/products/terraform) account, access to a [Domnain Factory](https://www.df.eu/) account (to administrate the web domains of the applications), and a Github account with access to a repo including the EduHub code (e.g. a fork of the given repo).

For the creation of the infrastructure, two Terrform Cloud workspaces need to be created. The first includes the variable settings to initialize the project on Google Cloud and is only run once at the very beginning. The second includes the variable settings to deploy the different applications and is run after each Pull-Request on the branch that is defined in a corresponding GitHub-Action.

The steps to setup the application are the following:

1. Create a Terraform Cloud workspace named "eduhub-foundation" choosing the "CLI-driven workflow", and define all variables described in the terraform file provided [here](https://github.com/edu-hub-project/application/blob/develop/infrastructure/foundation/00_variables.tf).

2. Next, install Terraform on your local computer, and authorize it for you Terraform Cloud account (see the instruction [here](https://learn.hashicorp.com/tutorials/terraform/install-cli)).

3. Connect your local Terraform to the foundation workspace by setting an environment variable "TF_WORKSPACE" to the name of the workspace (e.g.: "export TF_WORKSPACE=eduhub-foundation" for Linux).

4. Run Terraform apply via your local console: "terraform apply"
It might be that "terraform apply" runs into an error on the first run. Simply run it a second time, and it will successfully run through.

5. Create a Terraform Cloud workspace named "eduhub-application" choosing the "CLI-driven workflow", and define all variables described in the terraform file provided [here](https://github.com/edu-hub-project/application/blob/develop/infrastructure/application/00_variables.tf).
	Considering the variable GOOGLE_CREDENTIALS:
	- Log into Google Cloud with the Google user provided in the foundation workspace under the variable "key_generation_user".
	- Generate a JSON key for the Terraform service account created in the project with the project_id provided in the foundation workspace.
	- remove all new line characters in the downloaded JSON key and set the key as (sensitive) value for the variable.
	Considering the variable "commit_sha":
	- You don't need to provide a value here. It will be set during a GitHub action and serves to differentiate different Docker image versions by the GitHub commit SHA.

6. Add the following variables as secrets to your GitHub repository including the EduHub code:
	1. GCP_SERVICE_ACCOUNT_KEY
		- Log into Google Cloud with the Google user provided in the foundation workspace under the variable "key_generation_user".
		- Generate a JSON key for the GitHub service account created in the project with the project_id provided in the foundation workspace.
		- Add the JSON key as value to the secret
	2. TF_API_TOKEN
		- Log into Terraform Cloud and genarate a user access token.
		- Add the token as value to the secret.
	3. TF_WORKSPACE_PRODUCTION
		- The title of the application workspace you define above.
	4. TF_WORKSPACE_ID_PRODUCTION
	   - The value of the variable is provided in Terraform Cloud under the title of the corresponding workspace.
	5. TF_VAR_ID_COMMIT_SHA_PRODUCTION
		- The value for this variable is only displayed by conducting an API call to Terraform cloud. The format of the corresponding CURL command is as follows:
		```
		curl \
		--header "Authorization: Bearer $TF_API_TOKEN" \
		--header "Content-Type: application/vnd.api+json" \
		"https://app.terraform.io/api/v2/workspaces/$TF_WORKSPACE_ID/vars"
		```
		`TF_API_TOKEN` and `TF_WORKSPACE` must be set as corresponding environment variables in your local console.


The Terraform apply command for the workspace application is initiated by a GitHub action. In order to do so, it needs to be connected to the specific workspace and also to the git branch, which will trigger the Terraform apply.

7. Adapt GitHub action:
	- Under .github/workflows create a copy of "build-production-infrastructure.yml" and rename it to something in the pattern of "build-<branch>-infrastructure.yml"
	- replace all references to the GCP_SERVICE_ACCOUNT_KEY and PROJECT_ID, and the TF_WORKSPACE variable to the coresponding values
	- Go to Terraform cloud to get the workspace variable id and set env variable TF_WORKSPAVE_ID in the action correspondingly
	- use the below added CURL command to retrieve the ID for the variable "commit_sha". Set the env variable TF_VARIABLE_ID_COMMIT_SHA to this id
	### CURL command
	### Set the workspabe ID as need and and get a token from Terraform cloud and set it as $TF_API_TOKEN env variable in your local consol
	curl \
	--header "Authorization: Bearer $TF_API_TOKEN" \
	--header "Content-Type: application/vnd.api+json" \
	"https://app.terraform.io/api/v2/workspaces/ws-wzFdRXijjGbir9z6/vars"
	###

#############
Import der daten auf Keycloak (eduhub real importieren)
terraform aply (2. mal)
Import hasura
