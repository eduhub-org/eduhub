###############################################################################
# One Cloud Function (gen2) unit: function, runtime service account, secret
# access and public invoker IAM. See docs/SERVERLESS_FUNCTIONS.md for units.
#####

locals {
  # A dedicated account when service_account_id is set, the given one when
  # service_account_email is set, else null (the default compute account).
  service_account_email = (
    var.service_account_id != null
    ? google_service_account.this[0].email
    : var.service_account_email
  )

  secrets_by_key = { for secret in var.secret_environment_variables : secret.key => secret }
}

# Retrieve data object with zipped source code
data "google_storage_bucket_object" "source" {
  name   = var.source_object
  bucket = var.source_bucket
}

resource "google_service_account" "this" {
  count = var.service_account_id != null ? 1 : 0

  project      = var.project_id
  account_id   = var.service_account_id
  display_name = "Cloud Function ${var.name}"
}

# A dedicated account reads exactly the secrets it is given. A shared account
# passed in via service_account_email has its grants managed by the caller,
# so two units sharing it never manage the same grant twice.
resource "google_secret_manager_secret_iam_member" "secret_access" {
  for_each = var.service_account_id != null ? local.secrets_by_key : {}

  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.this[0].email}"
}

resource "google_cloudfunctions2_function" "this" {
  provider    = google-beta
  project     = var.project_id
  location    = var.region
  name        = var.name
  description = var.description

  build_config {
    runtime     = var.runtime
    entry_point = var.entry_point
    environment_variables = {
      # Causes a re-deploy of the function when the source changes
      "SOURCE_SHA" = data.google_storage_bucket_object.source.md5hash
    }
    source {
      storage_source {
        bucket = var.source_bucket
        object = data.google_storage_bucket_object.source.name
      }
    }
  }

  service_config {
    environment_variables = var.environment_variables

    dynamic "secret_environment_variables" {
      for_each = var.secret_environment_variables
      content {
        key        = secret_environment_variables.value.key
        project_id = var.project_id
        secret     = secret_environment_variables.value.secret_id
        version    = "latest"
      }
    }

    min_instance_count    = var.min_instance_count
    max_instance_count    = var.max_instance_count
    available_memory      = var.available_memory
    available_cpu         = var.available_cpu
    timeout_seconds       = var.timeout_seconds
    ingress_settings      = var.ingress_settings
    service_account_email = local.service_account_email
  }

  # A "latest" secret version only resolves once the account may read it.
  depends_on = [google_secret_manager_secret_iam_member.secret_access]
}

###############################################################################
# Public invoker: anyone may call the function; it checks the Hasura secret.
#####
data "google_iam_policy" "noauth_invoker" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth_invoker" {
  count = var.public_invoker == "policy" ? 1 : 0

  location    = google_cloudfunctions2_function.this.location
  project     = google_cloudfunctions2_function.this.project
  service     = google_cloudfunctions2_function.this.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

resource "google_cloud_run_service_iam_binding" "noauth_invoker" {
  count = var.public_invoker == "binding" ? 1 : 0

  location = var.region
  project  = var.project_id
  service  = google_cloudfunctions2_function.this.name
  role     = "roles/run.invoker"
  members  = ["allUsers"]
}
