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


###############################################################################
# Create Google Cloud Function Services
#####

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
    runtime     = "python38"
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
      ENVIRONMENT                  = var.environment
      BUCKET_NAME                  = var.project_id
      HASURA_ENDPOINT              = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_GRAPHQL_ADMIN_KEY     = var.hasura_graphql_admin_key
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      ZOOM_ACCOUNT_ID              = var.zoom_account_id
      ZOOM_API_KEY                 = var.zoom_api_key
      ZOOM_API_SECRET              = var.zoom_api_secret
      LMS_URL                      = var.lms_url
      LMS_USER                     = var.lms_user
      LMS_PASSWORD                 = var.lms_password
      LMS_ATTENDANCE_SURVEY_ID     = var.lms_attendance_survey_id
    }
    max_instance_count    = 500
    available_memory      = "256M"
    timeout_seconds       = 3600
    ingress_settings      = var.cloud_function_ingress_settings
    service_account_email = google_service_account.custom_cloud_function_account.email
  }
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
    runtime     = "nodejs18"
    entry_point = "callNodeFunction"
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.call_python_function.md5hash
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
    runtime     = "nodejs14"
    entry_point = "sendMail"
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
      EMULATE_EMAIL                = var.emulate_email
    }
    max_instance_count = 100
    available_memory   = "256M"
    timeout_seconds    = 600
    ingress_settings   = var.cloud_function_ingress_settings
  }
}

###############################################################################
# Create Google cloud function for updateKeycloakProfile
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "update_keycloak_profile_noauth_invoker" {
  location    = google_cloudfunctions2_function.update_keycloak_profile.location
  project     = google_cloudfunctions2_function.update_keycloak_profile.project
  service     = google_cloudfunctions2_function.update_keycloak_profile.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "update_keycloak_profile" {
  name   = "cloud-functions/updateKeycloakProfile.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "update_keycloak_profile" {
  provider    = google-beta
  location    = var.region
  name        = "update-keycloak-profile"
  description = "Updates the Keycloak profile on changes in Hasura"

  build_config {
    runtime     = "nodejs14"
    entry_point = "updateKeycloakProfile"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_keycloak_profile.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      LEYCLOAK_USER                = var.keycloak_user
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
    runtime     = "nodejs14"
    entry_point = "addKeycloakRole"
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
    runtime     = "nodejs14"
    entry_point = "updateFromKeycloak"
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
    runtime     = "nodejs16"
    entry_point = "sendQuestionaires"
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
