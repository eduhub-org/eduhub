# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the EduHub frontend service
resource "google_cloud_run_service_iam_policy" "eduhub_noauth_invoker" {
  location = google_cloud_run_service.eduhub.location
  project  = google_cloud_run_service.eduhub.project
  service  = google_cloud_run_service.eduhub.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Define the Google Cloud Run service for the Edu frontend
resource "google_cloud_run_service" "eduhub" {
  provider = google-beta
  name     = local.eduhub_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/edu:latest"

        ports {
          name           = "http1"
          container_port = 5000
        }
        env {
          name  = "EDU_SHA"
          value = var.frontend_sha
        }
        # rename to API_URL
        env {
          name  = "GRAPHQL_URI"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        env {
          name  = "NEXTAUTH_URL"
          value = "https://${local.eduhub_service_name}.opencampus.sh"
        }
        # # TODO Remove the following 3 env
        # env {
        #   name  = "NEXT_PUBLIC_API_URL"
        #   value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        # }
        # env {
        #   name  = "NEXT_PUBLIC_AUTH_URL"
        #   value = "https://${local.keycloak_service_name}.opencampus.sh"
        # }
        # env {
        #   name  = "NEXT_PUBLIC_HELP_DOCS_URL"
        #   value = var.help_docs_url
        # }
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
        env {
          name  = "NEXT_PUBLIC_MATRIX_ELEMENT_CLIENT_URL"
          value = var.matrix_element_client_url
        }
        env {
          name  = "NEXT_PUBLIC_STUJO_URL"
          value = "https://${local.stujo_domain}"
        }
        env {
          name = "GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.secret_id
              key  = "latest"
            }
          }
        }
        # The Stripe webhook handler (pages/api/webhooks/stripe.ts) runs in this
        # service, not in the cloud function: it needs the secret key to build
        # the client and the signing secret to verify event signatures. Without
        # both it answers every delivery with 500 "Stripe not configured", so a
        # paid course enrollment or job posting is charged but never published.
        env {
          name = "STRIPE_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_secret_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "STRIPE_WEBHOOK_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.stripe_webhook_secret.secret_id
              key  = "latest"
            }
          }
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
    google_secret_manager_secret_version.ghost_newsletter_credentials_encryption_key,
    google_secret_manager_secret_version.stripe_secret_key,
    google_secret_manager_secret_version.stripe_webhook_secret,
    google_secret_manager_secret_iam_member.stripe_secret_key_eduhub,
    google_secret_manager_secret_iam_member.stripe_webhook_secret_eduhub,
  ]
}
