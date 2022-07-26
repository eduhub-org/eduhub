###############################################################################
# Create Google Cloud Function Services
#####


###############################################################################
# Create Google cloud function for loadFile
#####
# Retrieve data object with zippe scource code
data "google_storage_bucket_object" "load_file" {
  name   = "cloud-functions/loadFile.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_file" {
  provider    = google-beta
  location    = var.region
  name        = "load-file"
  description = "Loads a file from Google Cloud Storage"

  build_config {
    runtime     = "nodejs14"
    entry_point = "loadFile"
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_file.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

# # IAM entry for a single user to invoke the loadFile function
# resource "google_cloudfunctions_function_iam_member" "invoker" {
#   project        = google_cloudfunctions_function.load_file.project
#   region         = google_cloudfunctions_function.load_file.region
#   cloud_function = google_cloudfunctions_function.load_file.name

#   role   = "roles/cloudfunctions.invoker"
#   member = "user:myFunctionInvoker@example.com"
# }

###############################################################################
# Create Google cloud function for saveFile
#####
# Retrieve data object with zippe scource code
data "google_storage_bucket_object" "save_file" {
  name   = "cloud-functions/saveFile.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_file" {
  provider    = google-beta
  location    = var.region
  name        = "save-file"
  description = "Loads a file from Google Cloud Storage"

  build_config {
    runtime     = "nodejs14"
    entry_point = "saveFile"
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_file.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for sendMail
#####
# Retrieve data object with zippe scource code
data "google_storage_bucket_object" "send_mail" {
  name   = "cloud-functions/sendMail.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "send_mail" {
  provider    = google-beta
  location    = var.region
  name        = "send-mail"
  description = "Loads a file from Google Cloud Storage"

  build_config {
    runtime     = "nodejs14"
    entry_point = "sendMail"
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.send_mail.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for updateKeycloakProfile
#####
# Retrieve data object with zippe scource code
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
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      LEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https:\\${var.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_keycloak_profile.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for updateFromKeycloak
#####
# Retrieve data object with zippe scource code
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
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      LEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https:\\${var.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
      HASURA_ENDPOINT              = "https:\\${var.hasura_service_name}.opencampus.sh/v1/graphql"
    }
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_from_keycloak.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}
