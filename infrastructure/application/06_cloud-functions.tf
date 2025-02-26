###############################################################################
# Create Google Cloud Function Service Account
#####
resource "google_service_account" "custom_cloud_function_account" {
  account_id   = "custom-cloud-function-account"
  display_name = "Custom Cloud Function Service Account"
  project      = var.project_id
}
resource "google_project_iam_member" "cloud_functions_developer" {
  project = var.project_id
  role    = "roles/cloudfunctions.developer"
  member  = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

resource "google_project_iam_member" "storage_object_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

resource "google_project_iam_member" "service_account_token_creator" {
  project = var.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

# Add Cloud Run invoker role to the service account
resource "google_project_iam_member" "cloud_run_invoker" {
  project = var.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

# Add explicit permission for the Cloud Function's service account to invoke Hasura
resource "google_cloud_run_service_iam_member" "function_invoke_hasura" {
  location = var.region
  service  = module.hasura_service.service_name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"

  depends_on = [
    module.hasura_service
  ]
}


###############################################################################
# Create Google Cloud Function Services
#####

###############################################################################
# Create Google cloud function for API proxy
#####
# Add the IAM binding to allow public access
resource "google_cloud_run_service_iam_binding" "api_proxy_noauth" {
  location = var.region
  project  = var.project_id
  service  = local.eduhub_api_service_name
  role     = "roles/run.invoker"
  members  = ["allUsers"]

  depends_on = [
    google_cloudfunctions2_function.api_proxy
  ]
}

# Retrieve data object with zipped source code
data "google_storage_bucket_object" "api_proxy" {
  name   = "cloud-functions/apiProxy.zip"
  bucket = var.project_id
}

# Create cloud function
resource "google_cloudfunctions2_function" "api_proxy" {
  provider    = google-beta
  location    = var.region
  name        = local.eduhub_api_service_name
  description = "API proxy for transforming and routing various API responses"

  build_config {
    runtime     = "python311"
    entry_point = "handle_request"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.api_proxy.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.api_proxy.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_ENDPOINT          = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_GRAPHQL_ADMIN_KEY = var.hasura_graphql_admin_key
      API_BASE_URL             = "https://${local.eduhub_service_name}.opencampus.sh"
      BUCKET_NAME              = var.project_id
      ENVIRONMENT              = var.environment
    }
    max_instance_count    = 1
    available_memory      = "256M"
    timeout_seconds       = 60
    ingress_settings      = var.cloud_function_ingress_settings
    service_account_email = google_service_account.custom_cloud_function_account.email
  }

  # Add lifecycle block to prevent cycles
  lifecycle {
    create_before_destroy = true
  }
}

###############################################################################
# Create Google cloud function for callPythonFunction
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "call_python_function_noauth_invoker" {
  location    = google_cloudfunctions2_function.call_python_function.location
  project     = google_cloudfunctions2_function.call_python_function.project
  service     = google_cloudfunctions2_function.call_python_function.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "call_python_function" {
  name   = "cloud-functions/callPythonFunction.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "call_python_function" {
  provider    = google-beta
  location    = var.region
  name        = "call-python-function"
  description = "Calls a Python function povided in the corresponding function folder"

  build_config {
    runtime     = "python311"
    entry_point = "call_python_function"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.call_python_function.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.call_python_function.name
      }
    }
  }

  service_config {
    environment_variables = {
      ENVIRONMENT              = var.environment
      BUCKET_NAME              = var.project_id
      HASURA_ENDPOINT          = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      ZOOM_ACCOUNT_ID          = var.zoom_account_id
      ZOOM_API_KEY             = var.zoom_api_key
      ZOOM_API_SECRET          = var.zoom_api_secret
      LMS_URL                  = var.lms_url
      LMS_USER                 = var.lms_user
      LMS_PASSWORD             = var.lms_password
      LMS_ATTENDANCE_SURVEY_ID = var.lms_attendance_survey_id
      MM_URL                   = var.mm_url
      MM_TOKEN                 = var.mm_token
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    max_instance_count    = 500
    available_memory      = "512M"
    timeout_seconds       = 3600
    ingress_settings      = var.cloud_function_ingress_settings
    service_account_email = google_service_account.custom_cloud_function_account.email
  }
}

# Make sure the Cloud Function's service account can access both secrets
resource "google_secret_manager_secret_iam_member" "call_python_function_admin_key_access" {
  secret_id = google_secret_manager_secret.hasura_graphql_admin_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

resource "google_secret_manager_secret_iam_member" "call_python_function_cloud_secret_access" {
  secret_id = google_secret_manager_secret.cloud_function.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

###############################################################################
# Create Google cloud function for callNodeFunction
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "call_node_function_noauth_invoker" {
  location    = google_cloudfunctions2_function.call_node_function.location
  project     = google_cloudfunctions2_function.call_node_function.project
  service     = google_cloudfunctions2_function.call_node_function.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "call_node_function" {
  name   = "cloud-functions/callNodeFunction.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "call_node_function" {
  provider    = google-beta
  location    = var.region
  name        = "call-node-function"
  description = "Calls a node function specificed via the function header."

  build_config {
    runtime     = "nodejs20"
    entry_point = "callNodeFunction"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.call_node_function.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.call_node_function.name
      }
    }
  }

  service_config {
    environment_variables = {
      ENVIRONMENT                  = var.environment
      KEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https://${local.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      HASURA_ENDPOINT              = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_ADMIN_SECRET          = var.hasura_graphql_admin_key
    }
    max_instance_count = 20
    available_memory   = "512M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}


###############################################################################
# Create Google cloud function for sendMail
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "send_mail_noauth_invoker" {
  location    = google_cloudfunctions2_function.send_mail.location
  project     = google_cloudfunctions2_function.send_mail.project
  service     = google_cloudfunctions2_function.send_mail.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "send_mail" {
  name   = "cloud-functions/sendMail.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "send_mail" {
  provider    = google-beta
  location    = var.region
  name        = "send-mail"
  description = "Sends an email as defined in the Hasura mail log table"

  build_config {
    runtime     = "nodejs20"
    entry_point = "sendMail"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.send_mail.md5hash
    }

    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.send_mail.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      HASURA_MAIL_PW               = var.hasura_mail_pw
      HASURA_MAIL_USER             = var.hasura_mail_user
      MAILGUN_API_KEY              = var.mailgun_api_key
      MAILGUN_DOMAIN               = var.mailgun_domain
      NODE_ENV                     = var.environment
    }
    max_instance_count = 100
    available_memory   = "256M"
    timeout_seconds    = 600
    ingress_settings   = var.cloud_function_ingress_settings
  }
}


###############################################################################
# Create Google cloud function for addKeycloakRole
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "add_keycloak_role_noauth_invoker" {
  location    = google_cloudfunctions2_function.add_keycloak_role.location
  project     = google_cloudfunctions2_function.add_keycloak_role.project
  service     = google_cloudfunctions2_function.add_keycloak_role.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "add_keycloak_role" {
  name   = "cloud-functions/addKeycloakRole.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "add_keycloak_role" {
  provider    = google-beta
  location    = var.region
  name        = "add-keycloak-role"
  description = "Adds role mapping for given role for keycloak hasura client"

  build_config {
    runtime     = "nodejs20"
    entry_point = "addKeycloakRole"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.add_keycloak_role.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.add_keycloak_role.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      KEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https://${local.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

###############################################################################
# Create Google cloud function for updateFromKeycloak
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "update_from_keycloak_noauth_invoker" {
  location    = google_cloudfunctions2_function.update_from_keycloak.location
  project     = google_cloudfunctions2_function.update_from_keycloak.project
  service     = google_cloudfunctions2_function.update_from_keycloak.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "update_from_keycloak" {
  name   = "cloud-functions/updateFromKeycloak.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "update_from_keycloak" {
  provider    = google-beta
  location    = var.region
  name        = "update-from-keycloak"
  description = "Looks up keycloak user of given uuid and creates new hasura user if necessary or updates existing"

  build_config {
    runtime     = "nodejs20"
    entry_point = "updateFromKeycloak"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.update_from_keycloak.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_from_keycloak.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      KEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https://${local.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
      HASURA_ENDPOINT              = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_ADMIN_SECRET          = var.hasura_graphql_admin_key
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}


###############################################################################
# Create Google cloud function for sendQuestionnaires
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "send_questionaires_noauth_invoker" {
  location    = google_cloudfunctions2_function.send_questionaires.location
  project     = google_cloudfunctions2_function.send_questionaires.project
  service     = google_cloudfunctions2_function.send_questionaires.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "send_questionaires" {
  name   = "cloud-functions/sendQuestionaires.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "send_questionaires" {
  provider    = google-beta
  location    = var.region
  name        = "send-questionaires"
  description = "send out questionaires for published past sessions"

  build_config {
    runtime     = "nodejs20"
    entry_point = "sendQuestionaires"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.send_questionaires.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.send_questionaires.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      HASURA_ENDPOINT              = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_ADMIN_SECRET          = var.hasura_graphql_admin_key
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

