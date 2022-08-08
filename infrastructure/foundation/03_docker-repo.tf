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

# Provide the Terraform service account with admin rights to the docker repository
resource "google_artifact_registry_repository_iam_member" "terraform" {
  provider   = google-beta
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.repoAdmin"
  member     = "serviceAccount:${google_service_account.terraform.email}"
}

# Provide any user with reading rights for the docker repository
resource "google_artifact_registry_repository_iam_member" "no_auth_reader" {
  provider   = google-beta
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.reader"
  member     = "allUsers"
}


# Create of a Google Cloud service account mainly to be used by GitHub to store the docker images
# for the different applications
resource "google_service_account" "github" {
  account_id   = "github"
  display_name = "GitHub Service Account"
}
# Give the created service account writing access to the docker repo in the artifact repository
resource "google_artifact_registry_repository_iam_member" "docker_repo" {
  provider   = google-beta
  location   = google_artifact_registry_repository.docker_repo.location
  repository = google_artifact_registry_repository.docker_repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.github.email}"
}

# Provide a given user with the permission to generate a JSON key for the above created terraform service account
resource "google_service_account_iam_member" "github_key_admin" {
  service_account_id = google_service_account.github.name
  role               = "roles/iam.serviceAccountKeyAdmin"
  member             = "user:${var.key_generation_user}"
}
