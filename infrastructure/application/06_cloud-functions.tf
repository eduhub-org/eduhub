# Cloud functions

# Definition of the functions and the repositories with the code
# Usage of a module?
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloudfunctions2_function

# ENVIRONMENT VARIABLES
#CLOUD_FUNCTION_SECRETS

#for updateKeycloakUrl
#KEYCLOAK_PW
#KEYCLOAK_URL

# resource "google_cloudfunctions_function" "load_file" {
#   name    = "load-file"
#   runtime = "python37"

#   # Get the source code of the cloud function as a Zip compression
#   source_archive_bucket = google_storage_bucket.function_bucket.name
#   source_archive_object = google_storage_bucket_object.zip.name

#   # Must match the function name in the cloud function `main.py` source code
#   entry_point = "hello_gcs"

#   # 
#   event_trigger {
#     event_type = "google.storage.object.finalize"
#     resource   = "${var.project_id}-input"
#   }
# }
