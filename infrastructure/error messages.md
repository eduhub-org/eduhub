
**************************
 Error: Error creating service account: googleapi: Error 403: Permission iam.serviceAccounts.create is required to perform this operation on project projects/eduhub-production., forbidden
│ 
│   with google_service_account.terraform,
│   on 02_projects.tf line 19, in resource "google_service_account" "terraform":
│   19: resource "google_service_account" "terraform" {
│ 
╵
╷
│ Error: Error creating Repository: googleapi: Error 403: Permission denied on resource project eduhub-production.
│ Details:
│ [
│   {
│     "@type": "type.googleapis.com/google.rpc.Help",
│     "links": [
│       {
│         "description": "Google developer console API key",
│         "url": "https://console.developers.google.com/project/eduhub-production/apiui/credential"
│       }
│     ]
│   },
│   {
│     "@type": "type.googleapis.com/google.rpc.ErrorInfo",
│     "domain": "googleapis.com",
│     "metadata": {
│       "consumer": "projects/eduhub-production",
│       "service": "artifactregistry.googleapis.com"
│     },
│     "reason": "CONSUMER_INVALID"
│   }
│ ]
│ 
│   with google_artifact_registry_repository.docker_repo,
│   on 03_docker-repo.tf line 6, in resource "google_artifact_registry_repository" "docker_repo":
│    6: resource "google_artifact_registry_repository" "docker_repo" {
│ 
╵
╷
│ Error: Error creating service account: googleapi: Error 403: Permission iam.serviceAccounts.create is required to perform this operation on project projects/eduhub-production., forbidden
│ 
│   with google_service_account.github,
│   on 03_docker-repo.tf line 34, in resource "google_service_account" "github":
│   34: resource "google_service_account" "github" {
│ 
╵
╷
│ Error: googleapi: Error 400: Unknown project id: eduhub-production, invalid
│ 
│   with google_storage_bucket.main,
│   on 04_storage.tf line 6, in resource "google_storage_bucket" "main":
│    6: resource "google_storage_bucket" "main" {
│ 
╵
*****************************

