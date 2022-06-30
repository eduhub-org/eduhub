###############################################################################
# Definition of the Google cloud project for the EduHub application
#####

# Get the folder for the EduHub application in which the current branch will be installed
data "google_folder" "branch" {
  folder = var.folder_id
}

# Create a project for the EduHub application in the given Google Cloud organization
resource "google_project" "eduhub" {
  folder_id       = data.google_folder.branch.name
  billing_account = var.billing_account
  name            = var.project_name
  project_id      = var.project_id
}

# Create a seperate service account to use with terraform within the created project
resource "google_service_account" "terraform_eduhub" {
  account_id   = "terraform-eduhub"
  display_name = "Terraform service account for this project"
}

# Provide the created terraform service account with the permission to edit the above created project
resource "google_project_iam_member" "editor" {
  project = google_project.eduhub.id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}
# Provide the created terraform service account with the permission to edit the above created project
resource "google_project_iam_member" "owner" {
  project = google_project.eduhub.id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}

# Provide the created terraform service account with the permission to manage the IAM of the project
resource "google_service_account_iam_member" "token_creator" {
  service_account_id = google_service_account.terraform_eduhub.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}

# Provide the created terraform service account with the permission to manage the IAM of the project
resource "google_service_account_iam_member" "project_iam_admin" {
  service_account_id = google_service_account.terraform_eduhub.name
  role               = "roles/iam.serviceAccountAdmin"
  member             = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}
# Provide the created terraform service account with the permission to manage the IAM of the project
resource "google_service_account_iam_member" "storage_iam_admin" {
  service_account_id = google_service_account.terraform_eduhub.name
  role               = "roles/iam.serviceAccountAdmin"
  member             = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}

# Provide a given user with the permission to generate a JSON key for the above created terraform service account
resource "google_service_account_iam_member" "project_iam_key_admin" {
  service_account_id = google_service_account.terraform_eduhub.name
  role               = "roles/iam.serviceAccountKeyAdmin"
  member             = "user:${var.key_generation_user}"
}

# Activate the following Google Cloud APIs for the project
module "project-services" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "10.1.1"

  project_id = google_project.eduhub.id
  activate_apis = [
    # Cloud Billing API
    "cloudbilling.googleapis.com",
    # Compute API
    "compute.googleapis.com",
    # Secret Manager API
    "secretmanager.googleapis.com",
    # Cloud Resource Manager API
    "cloudresourcemanager.googleapis.com",
    #Serverless VPC Access API
    "vpcaccess.googleapis.com",
    #Cloud Monitoring API
    "monitoring.googleapis.com",
    #Cloud Logging API
    "logging.googleapis.com",
    #Cloud Run API
    "run.googleapis.com",
    #Cloud SQL Admin API
    "sqladmin.googleapis.com",
    #Artifact Registry API
    "artifactregistry.googleapis.com",
    #Cloud Deployment Manager V2 API
    "deploymentmanager.googleapis.com",
    #Cloud Functions API
    "cloudfunctions.googleapis.com",
    #Identity and Access Management (IAM) API
    "iam.googleapis.com",
    #Service Networking API
    "servicenetworking.googleapis.com",
    #Cloud Resource Manager API
    "cloudresourcemanager.googleapis.com",
    #Eventarc API
    "eventarc.googleapis.com",
    #Cloud Build API
    "cloudbuild.googleapis.com",
    #Cloud Datastore API
    "datastore.googleapis.com",
    #Cloud Debugger API
    "clouddebugger.googleapis.com",
    #Google Cloud Firestore API
    "firestore.googleapis.com",
    #Cloud OS Login API
    "oslogin.googleapis.com",
    #Cloud Pub/Sub API
    "pubsub.googleapis.com",
    #Cloud SQL
    "sql-component.googleapis.com",
    #Cloud Storage
    "storage-component.googleapis.com",
    #Cloud Storage API
    "storage.googleapis.com",
    #Cloud Trace API
    "cloudtrace.googleapis.com",
    #Firebase Rules API
    "firebaserules.googleapis.com",
    #Google Cloud APIs
    "cloudapis.googleapis.com",
    #Google Cloud Storage JSON API
    "storage-api.googleapis.com",
    #IAM Service Account Credentials API
    "iamcredentials.googleapis.com",
    #Legacy Cloud Source Repositories API
    #"source.googleapis.com",
    #Service Management API
    "servicemanagement.googleapis.com",
    #Service Usage API
    "serviceusage.googleapis.com"
  ]
}

