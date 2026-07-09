###############################################################################
# Create Google Cloud Run service for Hasura
#####

# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the Cloud Run service for Hasura
resource "google_cloud_run_service_iam_policy" "hasura_noauth_invoker" {
  location = module.hasura_service.location
  project  = module.hasura_service.project_id
  service  = module.hasura_service.service_name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Define the Google Cloud Run service for Keycloak
module "hasura_service" {
  source  = "GoogleCloudPlatform/cloud-run/google"
  version = "~> 0.15.4"

  # Required variables
  service_name = local.hasura_service_name
  project_id   = var.project_id
  location     = var.region
  image        = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/backend:latest"

  limits = {
    cpu    = "1000m"
    memory = var.hasura_memory_limit
  }
  container_concurrency = "80"
  timeout_seconds       = 300 # Allow Hasura migrations to complete during startup (default 120s was too short)

  service_annotations = {
    "run.googleapis.com/client-name" = "terraform"
    "run.googleapis.com/ingress"     = "all"
    #"run.googleapis.com/launch-stage" = "BETA"
    #"run.googleapis.com/ingress-status" = "internal-and-cloud-load-balancing"
  }
  template_annotations = {
    "run.googleapis.com/client-name"           = "cloud-console"
    "run.googleapis.com/startup-cpu-boost"     = "true"
    "autoscaling.knative.dev/minScale"         = "1"
    "run.googleapis.com/vpc-access-egress"     = "private-ranges-only"
    "run.googleapis.com/cloudsql-instances"    = google_sql_database_instance.default.connection_name
    "run.googleapis.com/execution-environment" = "gen2"
    "autoscaling.knative.dev/maxScale"         = "1"
    "run.googleapis.com/vpc-access-connector"  = google_vpc_access_connector.default.id
  }

  depends_on = [google_secret_manager_secret_version.hasura_db_url, google_secret_manager_secret_version.hasura_graphql_admin_key, google_vpc_access_connector.default, google_secret_manager_secret_iam_member.hasura_db_url, google_secret_manager_secret_iam_member.hasura_graphql_admin_key, google_secret_manager_secret_iam_member.cloud_function, module.keycloak_service]

  env_vars = [
    {
      name  = "HASURA_SHA"
      value = var.hasura_sha
    },
    {
      name  = "HASURA_GRAPHQL_ENABLE_CONSOLE"
      value = var.hasura_graphql_enable_console
    },
    {
      name  = "HASURA_GRAPHQL_MIGRATIONS_SERVER_TIMEOUT"
      value = 300
    },
    {
      name  = "HASURA_GRAPHQL_DEV_MODE"
      value = var.hasura_graphql_dev_mode
    },
    {
      name  = "HASURA_GRAPHQL_ENABLED_LOG_TYPES"
      value = "startup, http-log, webhook-log, websocket-log, query-log"
    },
    {
      name  = "HASURA_GRAPHQL_UNAUTHORIZED_ROLE"
      value = "anonymous"
    },
    {
      name  = "HASURA_GRAPHQL_EXPERIMENTAL_FEATURES"
      value = "inherited_roles"
    },
    {
      name  = "HASURA_BUCKET"
      value = var.project_id
    },
    {
      name  = "CLOUD_FUNCTION_LINK_CALL_PYTHON_FUNCTION"
      value = google_cloudfunctions2_function.call_python_function.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SEND_MAIL"
      value = google_cloudfunctions2_function.send_mail.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_CALL_NODE_FUNCTION"
      value = google_cloudfunctions2_function.call_node_function.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_NODE_PAYMENTS"
      value = google_cloudfunctions2_function.node_payments.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_KEYCLOAK_ADMIN"
      value = google_cloudfunctions2_function.keycloak_admin.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SEND_QUESTIONAIRES"
      value = google_cloudfunctions2_function.send_questionaires.service_config[0].uri
    },
    {
      name  = "HASURA_GRAPHQL_JWT_SECRET"
      value = "{ \"type\": \"RS256\", \"jwk_url\": \"https://${local.keycloak_service_name}.opencampus.sh/realms/edu-hub/protocol/openid-connect/certs\" }"
    }
  ]
  env_secret_vars = [
    {
      name = "HASURA_GRAPHQL_ADMIN_SECRET"
      value_from = [
        {
          secret_key_ref = {
            key  = "latest"
            name = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
          }
        }
      ]
    },
    {
      name = "HASURA_GRAPHQL_DATABASE_URL"
      value_from = [
        {
          secret_key_ref = {
            key  = "latest"
            name = google_secret_manager_secret.hasura_db_url.secret_id
          }
        }
      ]
    },
    {
      name = "HASURA_CLOUD_FUNCTION_SECRET"
      value_from = [
        {
          secret_key_ref = {
            key  = "latest"
            name = google_secret_manager_secret.cloud_function.secret_id
          }
        }
      ]
    }
  ]
}
