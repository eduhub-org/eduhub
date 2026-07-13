# Apply IAM policy (see 'main.tf') which grants any user the privilege to invoke the StuJo frontend service
resource "google_cloud_run_service_iam_policy" "stujo_noauth_invoker" {
  location = google_cloud_run_service.stujo.location
  project  = google_cloud_run_service.stujo.project
  service  = google_cloud_run_service.stujo.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Define the Google Cloud Run service for the StuJo job board frontend
# (frontend-nx/apps/stujo, image built via Dockerfile-stujo). Runs under
# https://stujo.opencampus.sh (production) and
# https://stujo-staging.opencampus.sh (staging) — see local.stujo_domain.
resource "google_cloud_run_service" "stujo" {
  provider = google-beta
  name     = local.stujo_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/stujo:latest"

        ports {
          name           = "http1"
          container_port = 5001
        }
        env {
          name  = "STUJO_SHA"
          value = var.frontend_sha
        }
        env {
          name  = "GRAPHQL_URI"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        # Server-side (SSR) GraphQL endpoint for the public pages
        env {
          name  = "API_URL"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        env {
          name  = "NEXTAUTH_URL"
          value = "https://${local.stujo_domain}"
        }
        # Portal fallback when the request host has no AppSettings.domain match
        env {
          name  = "APP_NAME"
          value = "stujo"
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
          name = "KEYCLOAK_HASURA_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.keycloak_hasura_client_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        env {
          name  = "STORAGE_BUCKET_URL"
          value = "https://storage.googleapis.com/storage/v1/${var.project_id}"
        }
        env {
          name  = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          value = var.stripe_publishable_key
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
      "run.googleapis.com/launch-stage"     = "BETA"
      "run.googleapis.com/startupProbeType" = null
    }
  }

  lifecycle {
    ignore_changes = [
      metadata[0].annotations,
    ]
  }

  autogenerate_revision_name = true
  depends_on = [
    google_secret_manager_secret_version.hasura_graphql_admin_key,
    google_secret_manager_secret_version.nextauth_secret,
    google_secret_manager_secret_version.keycloak_hasura_client_secret,
  ]
}
