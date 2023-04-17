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
# Grant the compute engine service account permissions to access the secret for the Hasura graphql admin
resource "google_secret_manager_secret_iam_member" "hasura_graphql_admin_key" {
  secret_id  = google_secret_manager_secret.hasura_graphql_admin_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_graphql_admin_key]
}

# Grant the compute engine service account permissions to access the secrect for Hasura db url
resource "google_secret_manager_secret_iam_member" "hasura_db_url" {
  secret_id  = google_secret_manager_secret.hasura_db_url.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_db_url]
}

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
  version = "~> 0.2.0"

  # Required variables
  service_name = local.hasura_service_name
  project_id   = var.project_id
  location     = var.region
  image        = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/backend:${var.commit_sha}"

  limits = {
    cpu    = "1000m"
    memory = var.hasura_memory_limit
  }

  container_concurrency = "80"

  service_annotations = {
    "run.googleapis.com/client-name" = "terraform"
    "run.googleapis.com/ingress"     = "all"
    #"run.googleapis.com/launch-stage" = "BETA"
    #"run.googleapis.com/ingress-status" = "internal-and-cloud-load-balancing"
  }
  template_annotations = {
    "run.googleapis.com/client-name"           = "cloud-console"
    "autoscaling.knative.dev/minScale"         = "1"
    "run.googleapis.com/vpc-access-egress"     = "private-ranges-only"
    "run.googleapis.com/cloudsql-instances"    = google_sql_database_instance.default.connection_name
    "run.googleapis.com/execution-environment" = "gen2"
    "autoscaling.knative.dev/maxScale"         = "1"
    "run.googleapis.com/vpc-access-connector"  = google_vpc_access_connector.default.id
  }

  depends_on = [google_secret_manager_secret_version.hasura_db_url, google_secret_manager_secret_version.hasura_graphql_admin_key, google_vpc_access_connector.default, google_secret_manager_secret_iam_member.hasura_db_url, google_secret_manager_secret_iam_member.hasura_graphql_admin_key, google_secret_manager_secret_iam_member.cloud_function]

  env_vars = [
    {
      name  = "HASURA_GRAPHQL_ENABLE_CONSOLE"
      value = var.hasura_graphql_enable_console
    },
    {
      name  = "HASURA_GRAPHQL_MIGRATIONS_SERVER_TIMEOUT"
      value = 60
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
      name  = "CLOUD_FUNCTION_LINK_ADD_KEYCLOAK_ROLE"
      value = google_cloudfunctions2_function.add_keycloak_role.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_CERTIFICATE"
      value = google_cloudfunctions2_function.load_achievement_certificate.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_CERTIFICATE"
      value = google_cloudfunctions2_function.save_achievement_certificate.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_CERTIFICATE_TEMPLATE"
      value = google_cloudfunctions2_function.load_achievement_certificate_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_RECORD_DOCUMENTATION"
      value = google_cloudfunctions2_function.load_achievement_record_documentation.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT"
      value = google_cloudfunctions2_function.load_achievement_option_evaluation_script.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE"
      value = google_cloudfunctions2_function.load_achievement_option_documentation_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_CERTIFICATE_TEMPLATE"
      value = google_cloudfunctions2_function.save_achievement_certificate_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_PARTICIPATION_CERTIFICATE"
      value = google_cloudfunctions2_function.load_participation_certificate.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_PARTICIPATION_CERTIFICATE"
      value = google_cloudfunctions2_function.save_participation_certificate.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_LOAD_PARTICIPATION_CERTIFICATE_TEMPLATE"
      value = google_cloudfunctions2_function.load_participation_certificate_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_PARTICIPATION_CERTIFICATE_TEMPLATE"
      value = google_cloudfunctions2_function.save_participation_certificate_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_RECORD_COVER_IMAGE"
      value = google_cloudfunctions2_function.save_achievement_record_cover_image.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_RECORD_DOCUMENTATION"
      value = google_cloudfunctions2_function.save_achievement_record_documentation.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_OPTION_EVALUATION_SCRIPT"
      value = google_cloudfunctions2_function.save_achievement_option_evaluation_script.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_ACHIEVEMENT_OPTION_DOCUMENTATION_TEMPLATE"
      value = google_cloudfunctions2_function.save_achievement_option_documentation_template.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_COURSE_IMAGE"
      value = google_cloudfunctions2_function.save_course_image.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SAVE_USER_PROFILE_IMAGE"
      value = google_cloudfunctions2_function.save_user_profile_image.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_UPDATE_FROM_KEYCLOAK"
      value = google_cloudfunctions2_function.update_from_keycloak.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_SEND_MAIL"
      value = google_cloudfunctions2_function.send_mail.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_CREATE_ACHIEVEMENT_CERTIFICATE"
      value = google_cloudfunctions2_function.create_achievement_certificate.service_config[0].uri
    },
    {
      name  = "CLOUD_FUNCTION_LINK_CREATE_PARTICIPATION_CERTIFICATE"
      value = google_cloudfunctions2_function.create_participation_certificate.service_config[0].uri
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
