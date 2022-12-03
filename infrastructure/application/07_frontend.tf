# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the Frontend service
resource "google_cloud_run_service_iam_policy" "frontend_noauth_invoker" {
  location = google_cloud_run_service.frontend.location
  project  = google_cloud_run_service.frontend.project
  service  = google_cloud_run_service.frontend.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Create a variable for the NextAuth secret 
resource "google_secret_manager_secret" "nextauth_secret" {
  provider  = google-beta
  secret_id = "nextauth-secret"
  replication {
    automatic = true
  }
}
# Set the password of the NextAuth secret
resource "google_secret_manager_secret_version" "nextauth_secret" {
  provider    = google-beta
  secret      = google_secret_manager_secret.nextauth_secret.name
  secret_data = var.nextauth_secret
}
# Grant the compute engine service account permissions to access the secrect for the Hasura graphql admin
resource "google_secret_manager_secret_iam_member" "nextauth_secret" {
  secret_id  = google_secret_manager_secret.nextauth_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.nextauth_secret]
}

# Define the Google Cloud Run service for the Frontend
resource "google_cloud_run_service" "frontend" {
  provider = google-beta

  name     = local.frontend_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/frontend:${var.commit_sha}"
        ports {
          name           = "http1"
          container_port = 5000
        }
        env {
          name  = "NEXT_PUBLIC_API_URL"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        env {
          name  = "GRAPHQL_URI"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        env {
          name  = "NEXT_PUBLIC_AUTH_URL"
          value = "https://${local.keycloak_service_name}.opencampus.sh"
        }
        env {
          name = "HASURA_ADMIN_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nextauth_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "STORAGE_BUCKET_URL"
          value = "https://storage.googleapis.com/storage/v1/${var.project_id}"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "1"
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/launch-stage" = "BETA"
    }
  }

  lifecycle {
    ignore_changes = [
      metadata[0].annotations,
    ]
  }

  autogenerate_revision_name = true
  depends_on                 = [google_secret_manager_secret_version.hasura_graphql_admin_key]
}
