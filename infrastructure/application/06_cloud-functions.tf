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
      HASURA_ENDPOINT = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      API_BASE_URL    = "https://${local.eduhub_service_name}.opencampus.sh"
      BUCKET_NAME     = var.project_id
      ENVIRONMENT     = var.environment
      JWT_ISSUER      = "https://${local.keycloak_service_name}.opencampus.sh/realms/edu-hub"
      JWT_JWKS_URI    = "https://${local.keycloak_service_name}.opencampus.sh/realms/edu-hub/protocol/openid-connect/certs"
      JWT_AUDIENCE    = "hasura"
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
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
      ENVIRONMENT     = var.environment
      BUCKET_NAME     = var.project_id
      HASURA_ENDPOINT = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      ZOOM_ACCOUNT_ID = var.zoom_account_id
      # Grace buffers (in minutes) used by check_attendance to match Zoom
      # meeting occurrences to the EduHub session window. Optional — the
      # ZoomClient has sane defaults (30 min pre, 120 min post) when unset.
      ZOOM_ATTENDANCE_PRE_BUFFER_MIN  = var.zoom_attendance_pre_buffer_min
      ZOOM_ATTENDANCE_POST_BUFFER_MIN = var.zoom_attendance_post_buffer_min
      LMS_URL                         = var.lms_url
      LMS_USER                        = var.lms_user
      LMS_ATTENDANCE_SURVEY_ID        = var.lms_attendance_survey_id
      MM_URL                          = var.mm_url
      # StuJo job board (expire_job_postings / send_job_alerts mails). Follows
      # the canonical host, so mail links move to stujo.net at cutover.
      STUJO_FRONTEND_URL = "https://${local.stujo_public_host}"
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

    secret_environment_variables {
      key        = "ZOOM_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.zoom_api_key.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "ZOOM_API_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.zoom_api_secret.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "LMS_PASSWORD"
      project_id = var.project_id
      secret     = google_secret_manager_secret.lms_password.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "MM_TOKEN"
      project_id = var.project_id
      secret     = google_secret_manager_secret.mm_token.secret_id
      version    = "latest"
    }

    max_instance_count    = 500
    available_memory      = "1024M"
    available_cpu         = "1"
    timeout_seconds       = 3600
    ingress_settings      = var.cloud_function_ingress_settings
    service_account_email = google_service_account.custom_cloud_function_account.email
  }
}

# Make sure the Cloud Function's service account can access all secrets
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

resource "google_secret_manager_secret_iam_member" "call_python_function_zoom_api_key" {
  secret_id  = google_secret_manager_secret.zoom_api_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.zoom_api_key]
}

resource "google_secret_manager_secret_iam_member" "call_python_function_zoom_api_secret" {
  secret_id  = google_secret_manager_secret.zoom_api_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.zoom_api_secret]
}

resource "google_secret_manager_secret_iam_member" "call_python_function_lms_password" {
  secret_id  = google_secret_manager_secret.lms_password.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.lms_password]
}

resource "google_secret_manager_secret_iam_member" "call_python_function_mm_token" {
  secret_id  = google_secret_manager_secret.mm_token.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.mm_token]
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
    runtime     = "nodejs22"
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
      ENVIRONMENT               = var.environment
      KEYCLOAK_USER             = var.keycloak_user
      KEYCLOAK_URL              = "https://${local.keycloak_service_name}.opencampus.sh"
      HASURA_ENDPOINT           = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      FRONTEND_URL              = "https://${local.eduhub_service_name}.opencampus.sh"
      STORAGE_BUCKET_PUBLIC_URL = "https://storage.googleapis.com/${var.project_id}"
      FORMBRICKS_API_URL        = var.formbricks_api_url
      MATRIX_HOMESERVER_URL     = var.matrix_homeserver_url
      MATRIX_SERVER_NAME        = var.matrix_server_name
      MATRIX_ELEMENT_CLIENT_URL = var.matrix_element_client_url
      MATRIX_MAIN_SPACE_ID      = var.matrix_main_space_id
      MATRIX_ADMIN_USER_ID      = var.matrix_admin_user_id
      # StuJo job board (publishJobPosting / createStripeJobPostingPrices).
      # Also the Stripe checkout success/cancel return URLs.
      STUJO_FRONTEND_URL           = "https://${local.stujo_public_host}"
      STUJO_ADMIN_EMAIL            = var.stujo_admin_email
      STRIPE_TAX_RATE_ID           = var.stripe_tax_rate_id
      STUJO_SELLER_ORGANIZATION_ID = var.stujo_seller_organization_id
    }

    secret_environment_variables {
      key        = "KEYCLOAK_PW"
      project_id = var.project_id
      secret     = google_secret_manager_secret.keycloak_pw.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "FORMBRICKS_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.formbricks_api_key.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "STRIPE_SECRET_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.stripe_secret_key.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "MATRIX_ADMIN_ACCESS_TOKEN"
      project_id = var.project_id
      secret     = google_secret_manager_secret.matrix_admin_access_token.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.secret_id
      version    = "latest"
    }

    max_instance_count    = 20
    available_memory      = "512M"
    timeout_seconds       = 60
    ingress_settings      = var.cloud_function_ingress_settings
    service_account_email = google_service_account.custom_cloud_function_account.email
  }
}

# Make sure the Cloud Function's service account can access all required secrets
resource "google_secret_manager_secret_iam_member" "call_node_function_formbricks_api_key" {
  secret_id  = google_secret_manager_secret.formbricks_api_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.formbricks_api_key]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_keycloak_pw" {
  secret_id  = google_secret_manager_secret.keycloak_pw.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.keycloak_pw]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_cloud_function_secret" {
  secret_id  = google_secret_manager_secret.cloud_function.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.cloud_function]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_hasura_admin_key" {
  secret_id  = google_secret_manager_secret.hasura_graphql_admin_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.hasura_graphql_admin_key]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_matrix_admin_access_token" {
  secret_id  = google_secret_manager_secret.matrix_admin_access_token.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.matrix_admin_access_token]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_ghost_encryption_key" {
  secret_id  = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.ghost_newsletter_credentials_encryption_key]
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
    runtime     = "nodejs22"
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
      HASURA_MAIL_USER = var.hasura_mail_user
      MAILGUN_DOMAIN   = var.mailgun_domain
      ENVIRONMENT      = var.environment
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_MAIL_PW"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_mail_pw.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "MAILGUN_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.mailgun_api_key.secret_id
      version    = "latest"
    }

    max_instance_count = 100
    available_memory   = "256M"
    timeout_seconds    = 600
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

# Add IAM permissions for the secrets
resource "google_secret_manager_secret_iam_member" "send_mail_cloud_function_secret" {
  secret_id = google_secret_manager_secret.cloud_function.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

resource "google_secret_manager_secret_iam_member" "send_mail_hasura_mail_pw" {
  secret_id = google_secret_manager_secret.hasura_mail_pw.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

resource "google_secret_manager_secret_iam_member" "send_mail_mailgun_api_key" {
  secret_id = google_secret_manager_secret.mailgun_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
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
    runtime     = "nodejs22"
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
      KEYCLOAK_USER = var.keycloak_user
      KEYCLOAK_URL  = "https://${local.keycloak_service_name}.opencampus.sh"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "KEYCLOAK_PW"
      project_id = var.project_id
      secret     = google_secret_manager_secret.keycloak_pw.secret_id
      version    = "latest"
    }

    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

###############################################################################
# Create Google cloud function for removeKeycloakRole
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "remove_keycloak_role_noauth_invoker" {
  location    = google_cloudfunctions2_function.remove_keycloak_role.location
  project     = google_cloudfunctions2_function.remove_keycloak_role.project
  service     = google_cloudfunctions2_function.remove_keycloak_role.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "remove_keycloak_role" {
  name   = "cloud-functions/removeKeycloakRole.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "remove_keycloak_role" {
  provider    = google-beta
  location    = var.region
  name        = "remove-keycloak-role"
  description = "Removes role mapping for given role from keycloak hasura client once the backing grant is gone"

  build_config {
    runtime     = "nodejs22"
    entry_point = "removeKeycloakRole"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.remove_keycloak_role.md5hash
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.remove_keycloak_role.name
      }
    }
  }

  service_config {
    environment_variables = {
      KEYCLOAK_USER   = var.keycloak_user
      KEYCLOAK_URL    = "https://${local.keycloak_service_name}.opencampus.sh"
      HASURA_ENDPOINT = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "KEYCLOAK_PW"
      project_id = var.project_id
      secret     = google_secret_manager_secret.keycloak_pw.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
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
    runtime     = "nodejs22"
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
      KEYCLOAK_USER   = var.keycloak_user
      KEYCLOAK_URL    = "https://${local.keycloak_service_name}.opencampus.sh"
      HASURA_ENDPOINT = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "KEYCLOAK_PW"
      project_id = var.project_id
      secret     = google_secret_manager_secret.keycloak_pw.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
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
    runtime     = "nodejs22"
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
      HASURA_ENDPOINT = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
    }

    secret_environment_variables {
      key        = "HASURA_CLOUD_FUNCTION_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.cloud_function.secret_id
      version    = "latest"
    }

    secret_environment_variables {
      key        = "HASURA_ADMIN_SECRET"
      project_id = var.project_id
      secret     = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
      version    = "latest"
    }

    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

