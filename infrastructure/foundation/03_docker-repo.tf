###############################################################################
# Creation of a Docker Repository in the Artifact Registry
#####

# Create a repository for storing docker images in the Google Cloud artifact registry
resource "google_artifact_registry_repository" "docker_repo" {
  provider      = google-beta
  location      = var.region
  repository_id = "docker-repo"
  format        = "DOCKER"
}


resource "google_artifact_registry_repository_iam_member" "terraform_eduhub" {
  provider   = google-beta
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.repoAdmin"
  member     = "serviceAccount:${google_service_account.terraform_eduhub.email}"
}

# Create of a Google Cloud service account to manage the docker repo in the artifact registry
resource "google_service_account" "docker_repo" {
  account_id   = "docker-repo"
  display_name = "Docker Repository"
}
# Give the created service account writing access to the docker repo in the artifact repository
resource "google_artifact_registry_repository_iam_member" "docker_repo" {
  provider   = google-beta
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.docker_repo.email}"
}

# Provide a given user with the permission to generate a JSON key for the above created terraform service account
resource "google_service_account_iam_member" "docker_repo_key_admin" {
  service_account_id = google_service_account.docker_repo.name
  role               = "roles/iam.serviceAccountKeyAdmin"
  member             = "user:${var.key_generation_user}"
}
