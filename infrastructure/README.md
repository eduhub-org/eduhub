# Deploying the Application on Google Cloud

The process to setup the infrastructure and deploy the application consists of the following main parts:

- two terraform workspaces connected to two folders with terraform scripts that manage the infrastructure (and partially also to deploy the application)
- different yml files including GitHub actions that are triggered on pull requests to deploy new versions of the application on merges from pull requests
- four folders including the dockerfiles and code for the implemented or integrated applications. Currently the following four applications are hosted:
    - [Keycloak](https://www.keycloak.org/) (Open Source Identity and Access Management)
    - [Hasura](https://hasura.io/) (GraphQL Server)
    - EduHub (React frontend application)
    - Rent-a-Scientist (React frontend application)

Further, several serverless functions are implemented and hosted as part of the overall application. Beyond the serverless functions, Hasura and Keycloak, no additional backend code is implemented.



Setup a foundation workspace in Terraform cloud
apply the variable set for "foundation"
define the project_name, project_id, and the folder_id for the folder in Google Cloud, where the project will be located

set env variable in consoloe to the name of the workspace (e.g.: "export TF_WORKSPACE=eduhub-foundation-production")

apply terraform via cli
(you might have to apply it twice since some resources are tried to be used before they are fully created; see error message in file "error message.md".)

Setup a application workspace in Terraform cloud

apply the variable set for "application"

define the twelve extra variable for the application workspace
-> Get the GOOGLE_CREDENTIALS password by:
	-logging in Google Cloud with user provided under in the foundation workspace variable "key_generation_user"
	- generate a JSON key for the terraform service account created in the project with project_id
	- remove all new line characters in the downloaded JSON key and save the key as (sensitive) environment variable in the workspace.
-> The value for the variable "commit_sha" can be left empty. This one will be set during the GitHub action.

Add a GCP_SERVICE_ACCOUNT_KEY secret in the github repository
	- log in as above in Google Cloud and create a JSON key for the gitHub Service Account
	- Ad the JSON key as secret in for the GitHub repository
	
Add the secret "TF_API_TOKEN" as well to the github repo and add an access token generated in terraform cloud.

Under .github/workflows:
	- create a copy of build-<env>-infrastructure
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
