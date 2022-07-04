###############################################################################
# Create Google Cloud Run service for Hasura
#####

# Create a variable for the access to the Google Cloud functions in the Google secret manager 
resource "google_secret_manager_secret" "cloud_function" {
  provider  = google-beta
  secret_id = "cloud-function"
  replication {
    automatic = true
  }
}
# Set the password for the Hasura cloud function secret
resource "google_secret_manager_secret_version" "cloud_function" {
  provider    = google-beta
  secret      = google_secret_manager_secret.cloud_function.name
  secret_data = var.hasura_cloud_function_secret
}
# Grant the compute engine service account permissions to access cloud functions secret 
resource "google_secret_manager_secret_iam_member" "cloud_function" {
  secret_id  = google_secret_manager_secret.cloud_function.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.cloud_function]
}

# Create a variable for the password of the Hasura graphql admin 
resource "google_secret_manager_secret" "hasura_graphql_admin_key" {
  provider  = google-beta
  secret_id = "hasura-graphql-admin-key"
  replication {
    automatic = true
  }
}
# Set the password for the Hasura graphql admin in the Google secret manager
resource "google_secret_manager_secret_version" "hasura_graphql_admin_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.hasura_graphql_admin_key.name
  secret_data = var.hasura_graphql_admin_key
}
# Grant the compute engine service account permissions to access the secrect for the Hasura graphql admin
resource "google_secret_manager_secret_iam_member" "hasura_db_url" {
  secret_id  = google_secret_manager_secret.hasura_db_url.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_db_url]
}

# Grant the compute engine service account permissions to access the secret for Hasura db url
resource "google_secret_manager_secret_iam_member" "hasura_graphql_admin_key" {
  secret_id  = google_secret_manager_secret.hasura_graphql_admin_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_graphql_admin_key]
}

# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the Cloud Rund service for Hasura
resource "google_cloud_run_service_iam_policy" "hasura_noauth_invoker" {
  location = google_cloud_run_service.hasura.location
  project  = google_cloud_run_service.hasura.project
  service  = google_cloud_run_service.hasura.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Define the Google Cloud Run service for Hasura
resource "google_cloud_run_service" "hasura" {
  provider = google-beta
  name     = var.hasura_service_name
  location = var.region

  template {
    spec {
      containers {

        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/backend:integration-of-terraform-and-github"
        resources {
          limits = {
            memory = var.hasura_memory_limit
          }
        }
        env {
          name  = "HASURA_GRAPHQL_ENABLE_CONSOLE"
          value = var.hasura_graphql_enable_console
        }
        env {
          name  = "HASURA_GRAPHQL_DEV_MODE"
          value = var.hasura_graphql_dev_mode
        }
        env {
          name  = "HASURA_GRAPHQL_ENABLED_LOG_TYPES"
          value = "startup, http-log, webhook-log, websocket-log, query-log"
        }
        env {
          name  = "HASURA_GRAPHQL_UNAUTHORIZED_ROLE"
          value = "anonymous"
        }
        env {
          name  = "HASURA_GRAPHQL_EXPERIMENTAL_FEATURES"
          value = "inherited_roles"
        }
        env {
          name  = "HASURA_BUCKET"
          value = "storage-bucket"
        }
        env {
          name  = "CLOUD_FUNCTION_LINK"
          value = "https://${var.region}-${var.project_id}.cloudfunctions.net"
        }
        env {
          name  = "HASURA_GRAPHQL_JWT_SECRET"
          value = "{ \"type\": \"RS256\", \"jwk_url\": \"https://${var.keycloak_service_name}.opencampus.sh/realms/edu-hub/protocol/openid-connect/certs\" }"
        }
        env {
          name = "HASURA_GRAPHQL_ADMIN_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "HASURA_GRAPHQL_DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.hasura_db_url.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "HASURA_CLOUD_FUNCTION_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.cloud_function.secret_id
              key  = "latest"
            }
          }
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"        = "0"
        "autoscaling.knative.dev/maxScale"        = "1"
        "run.googleapis.com/vpc-access-connector" = "vpc-lan-con"
        "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
        "run.googleapis.com/cloudsql-instances"   = google_sql_database_instance.default.connection_name
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
  depends_on                 = [google_secret_manager_secret_version.hasura_db_url, google_secret_manager_secret_version.hasura_graphql_admin_key, google_vpc_access_connector.default, google_secret_manager_secret_iam_member.hasura_db_url, google_secret_manager_secret_iam_member.hasura_graphql_admin_key, google_secret_manager_secret_iam_member.cloud_function]
}

