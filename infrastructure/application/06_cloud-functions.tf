###############################################################################
# Cloud Functions: one module instance per unit (functions/units.json).
#
# Units split by secret scope and resource profile, not by domain
# (docs/adr/0002-function-units-by-secret-scope.md). identity and media run
# callNodeFunction's zip with their own entry point, service account and
# secrets. moved blocks for the addresses before the module are in
# 06_cloud-functions-moved.tf.
#####

###############################################################################
# Shared service account of callNodeFunction, callPythonFunction and apiProxy
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
# Units
#####
locals {
  hasura_endpoint = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
  keycloak_url    = "https://${local.keycloak_service_name}.opencampus.sh"

  # Secrets a unit can be given, by the environment variable it reads.
  function_secrets = {
    HASURA_ADMIN_SECRET                         = google_secret_manager_secret.hasura_graphql_admin_key
    HASURA_CLOUD_FUNCTION_SECRET                = google_secret_manager_secret.cloud_function
    KEYCLOAK_PW                                 = google_secret_manager_secret.keycloak_pw
    FORMBRICKS_API_KEY                          = google_secret_manager_secret.formbricks_api_key
    STRIPE_SECRET_KEY                           = google_secret_manager_secret.stripe_secret_key
    MATRIX_ADMIN_ACCESS_TOKEN                   = google_secret_manager_secret.matrix_admin_access_token
    MATRIX_SYNAPSE_ADMIN_TOKEN                  = google_secret_manager_secret.matrix_synapse_admin_token
    GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key
    GUEST_TOKEN_SECRET                          = google_secret_manager_secret.guest_token_secret
    HASURA_MAIL_PW                              = google_secret_manager_secret.hasura_mail_pw
    MAILGUN_API_KEY                             = google_secret_manager_secret.mailgun_api_key
    ZOOM_API_KEY                                = google_secret_manager_secret.zoom_api_key
    ZOOM_API_SECRET                             = google_secret_manager_secret.zoom_api_secret
    LMS_PASSWORD                                = google_secret_manager_secret.lms_password
    MM_TOKEN                                    = google_secret_manager_secret.mm_token
  }
  secret_env = {
    for key, secret in local.function_secrets : key => {
      key       = key
      secret_id = secret.secret_id
      id        = secret.id
    }
  }

  # The Synapse admin token has a version only once it is set, and a missing
  # "latest" version would fail the deployment. Whether it is set is not
  # itself secret, and must not be: it decides a for_each in the module.
  matrix_synapse_admin_token = nonsensitive(var.matrix_synapse_admin_token != "") ? [local.secret_env.MATRIX_SYNAPSE_ADMIN_TOKEN] : []

  matrix_env = {
    MATRIX_HOMESERVER_URL     = var.matrix_homeserver_url
    MATRIX_SERVER_NAME        = var.matrix_server_name
    MATRIX_ELEMENT_CLIENT_URL = var.matrix_element_client_url
    MATRIX_MAIN_SPACE_ID      = var.matrix_main_space_id
    MATRIX_ADMIN_USER_ID      = var.matrix_admin_user_id
  }

  # One entry per deployed unit. Keys are the module instance keys (and match
  # the resource names before the module). Leave out service_account_* to run
  # as the default compute account; service_account_id creates a dedicated
  # account that may read exactly `secrets`; service_account_email shares an
  # account whose grants are managed below.
  cloud_function_units = {
    ###########################################################################
    call_node_function = {
      name          = "call-node-function"
      description   = "Calls a node function specificed via the function header."
      runtime       = "nodejs22"
      entry_point   = "callNodeFunction"
      source_object = "cloud-functions/callNodeFunction.zip"
      memory        = "512M"
      timeout       = 180
      max_instances = 20
      env = merge(local.matrix_env, {
        ENVIRONMENT               = var.environment
        KEYCLOAK_USER             = var.keycloak_user
        KEYCLOAK_URL              = local.keycloak_url
        HASURA_ENDPOINT           = local.hasura_endpoint
        FRONTEND_URL              = "https://${local.eduhub_service_name}.opencampus.sh"
        STORAGE_BUCKET_PUBLIC_URL = "https://storage.googleapis.com/${var.project_id}"
        FORMBRICKS_API_URL        = var.formbricks_api_url
        # StuJo job board (publishJobPosting / createStripeJobPostingPrices).
        # Also the Stripe checkout success/cancel return URLs.
        STUJO_FRONTEND_URL           = "https://${local.stujo_public_host}"
        STUJO_ADMIN_EMAIL            = var.stujo_admin_email
        STRIPE_TAX_RATE_ID           = var.stripe_tax_rate_id
        STUJO_SELLER_ORGANIZATION_ID = var.stujo_seller_organization_id
      })
      secrets = concat(
        [
          local.secret_env.KEYCLOAK_PW,
          local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
          local.secret_env.HASURA_ADMIN_SECRET,
          local.secret_env.FORMBRICKS_API_KEY,
          local.secret_env.STRIPE_SECRET_KEY,
          local.secret_env.MATRIX_ADMIN_ACCESS_TOKEN,
        ],
        local.matrix_synapse_admin_token,
        [
          local.secret_env.GHOST_NEWSLETTER_CREDENTIALS_ENCRYPTION_KEY,
          local.secret_env.GUEST_TOKEN_SECRET,
        ],
      )
      service_account_email = google_service_account.custom_cloud_function_account.email
    }

    ###########################################################################
    call_python_function = {
      name          = "call-python-function"
      description   = "Calls a Python function povided in the corresponding function folder"
      runtime       = "python311"
      entry_point   = "call_python_function"
      source_object = "cloud-functions/callPythonFunction.zip"
      memory        = "1024M"
      cpu           = "1"
      timeout       = 3600
      max_instances = 500
      env = {
        ENVIRONMENT     = var.environment
        BUCKET_NAME     = var.project_id
        HASURA_ENDPOINT = local.hasura_endpoint
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
        # Mailgun sending domains, mirrored from the send_mail unit:
        # sync_mail_delivery_status reads delivery events for exactly the domains
        # this deployment is allowed to send through, so a newly added portal
        # host gets bounce tracking without a code change.
        MAILGUN_DOMAIN             = var.mailgun_domain
        MAILGUN_ADDITIONAL_DOMAINS = join(",", var.mailgun_additional_domains)
        # Recipient of the sync_mail_delivery_status bounce-rate alert.
        STUJO_ADMIN_EMAIL = var.stujo_admin_email
      }
      # MAILGUN_API_KEY: sync_mail_delivery_status reads the Mailgun events
      # API. This is the same credential sendMail sends with, which is more
      # privilege than the cron needs -- it never sends. A key scoped to
      # read-only would be the better shape; it needs minting in Mailgun first,
      # and note the prod key is domain-restricted, so any replacement must
      # cover every sending domain above or the events walk 401s per domain.
      secrets = [
        local.secret_env.HASURA_ADMIN_SECRET,
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.ZOOM_API_KEY,
        local.secret_env.ZOOM_API_SECRET,
        local.secret_env.LMS_PASSWORD,
        local.secret_env.MM_TOKEN,
        local.secret_env.MAILGUN_API_KEY,
      ]
      service_account_email = google_service_account.custom_cloud_function_account.email
    }

    # API proxy for transforming and routing various API responses. Keeps
    # its IAM binding (not a policy) for allUsers.
    api_proxy = {
      name          = local.eduhub_api_service_name
      description   = "API proxy for transforming and routing various API responses"
      runtime       = "python311"
      entry_point   = "handle_request"
      source_object = "cloud-functions/apiProxy.zip"
      memory        = "256M"
      timeout       = 60
      max_instances = 1
      env = {
        HASURA_ENDPOINT = local.hasura_endpoint
        API_BASE_URL    = "https://${local.eduhub_service_name}.opencampus.sh"
        BUCKET_NAME     = var.project_id
        ENVIRONMENT     = var.environment
        JWT_ISSUER      = "https://${local.keycloak_service_name}.opencampus.sh/realms/edu-hub"
        JWT_JWKS_URI    = "https://${local.keycloak_service_name}.opencampus.sh/realms/edu-hub/protocol/openid-connect/certs"
        JWT_AUDIENCE    = "hasura"
      }
      secrets = [
        local.secret_env.HASURA_ADMIN_SECRET,
      ]
      service_account_email = google_service_account.custom_cloud_function_account.email
      public_invoker        = "binding"
    }

    # Sends an email as defined in the Hasura MailLog table.
    send_mail = {
      name          = "send-mail"
      description   = "Sends an email as defined in the Hasura mail log table"
      runtime       = "nodejs22"
      entry_point   = "sendMail"
      source_object = "cloud-functions/sendMail.zip"
      memory        = "256M"
      timeout       = 600
      max_instances = 100
      env = {
        HASURA_MAIL_USER           = var.hasura_mail_user
        MAILGUN_DOMAIN             = var.mailgun_domain
        MAILGUN_ADDITIONAL_DOMAINS = join(",", var.mailgun_additional_domains)
        ENVIRONMENT                = var.environment
      }
      secrets = [
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.HASURA_MAIL_PW,
        local.secret_env.MAILGUN_API_KEY,
      ]
    }

    ###########################################################################
    add_keycloak_role = {
      name          = "add-keycloak-role"
      description   = "Adds role mapping for given role for keycloak hasura client"
      runtime       = "nodejs22"
      entry_point   = "addKeycloakRole"
      source_object = "cloud-functions/addKeycloakRole.zip"
      memory        = "256M"
      timeout       = 60
      max_instances = 1
      env = {
        KEYCLOAK_USER = var.keycloak_user
        KEYCLOAK_URL  = local.keycloak_url
      }
      secrets = [
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.KEYCLOAK_PW,
      ]
    }

    remove_keycloak_role = {
      name          = "remove-keycloak-role"
      description   = "Removes role mapping for given role from keycloak hasura client once the backing grant is gone"
      runtime       = "nodejs22"
      entry_point   = "removeKeycloakRole"
      source_object = "cloud-functions/removeKeycloakRole.zip"
      memory        = "256M"
      timeout       = 60
      max_instances = 1
      env = {
        KEYCLOAK_USER   = var.keycloak_user
        KEYCLOAK_URL    = local.keycloak_url
        HASURA_ENDPOINT = local.hasura_endpoint
      }
      secrets = [
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.KEYCLOAK_PW,
        local.secret_env.HASURA_ADMIN_SECRET,
      ]
    }

    update_from_keycloak = {
      name          = "update-from-keycloak"
      description   = "Looks up keycloak user of given uuid and creates new hasura user if necessary or updates existing"
      runtime       = "nodejs22"
      entry_point   = "updateFromKeycloak"
      source_object = "cloud-functions/updateFromKeycloak.zip"
      memory        = "256M"
      timeout       = 60
      max_instances = 1
      env = {
        KEYCLOAK_USER   = var.keycloak_user
        KEYCLOAK_URL    = local.keycloak_url
        HASURA_ENDPOINT = local.hasura_endpoint
      }
      secrets = [
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.KEYCLOAK_PW,
        local.secret_env.HASURA_ADMIN_SECRET,
      ]
    }

    send_questionaires = {
      name          = "send-questionaires"
      description   = "send out questionaires for published past sessions"
      runtime       = "nodejs22"
      entry_point   = "sendQuestionaires"
      source_object = "cloud-functions/sendQuestionaires.zip"
      memory        = "256M"
      timeout       = 60
      max_instances = 1
      env = {
        HASURA_ENDPOINT = local.hasura_endpoint
      }
      secrets = [
        local.secret_env.HASURA_CLOUD_FUNCTION_SECRET,
        local.secret_env.HASURA_ADMIN_SECRET,
      ]
    }
  }
}

module "cloud_function" {
  source   = "./modules/cloud_function"
  for_each = local.cloud_function_units

  project_id    = var.project_id
  region        = var.region
  name          = each.value.name
  description   = each.value.description
  runtime       = each.value.runtime
  entry_point   = each.value.entry_point
  source_bucket = var.project_id
  source_object = each.value.source_object

  available_memory   = each.value.memory
  available_cpu      = try(each.value.cpu, null)
  timeout_seconds    = each.value.timeout
  max_instance_count = each.value.max_instances
  ingress_settings   = var.cloud_function_ingress_settings

  environment_variables        = each.value.env
  secret_environment_variables = each.value.secrets

  service_account_email = try(each.value.service_account_email, null)
  service_account_id    = try(each.value.service_account_id, null)
  public_invoker        = try(each.value.public_invoker, "policy")
}

###############################################################################
# Secret access of the shared custom_cloud_function_account
#
# callNodeFunction, callPythonFunction and apiProxy share this account, so
# its grants live here rather than in the module. Some (secret, account)
# pairs are granted by two resources (e.g. the admin key below, for Python
# and Node): destroying either one revokes the binding for both, so remove
# such a pair only together.
#####
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

# Granted on the shared account although sendMail runs as the default
# compute account; callPythonFunction relies on the Mailgun one.
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

resource "google_secret_manager_secret_iam_member" "call_node_function_matrix_synapse_admin_token" {
  secret_id  = google_secret_manager_secret.matrix_synapse_admin_token.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.matrix_synapse_admin_token]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_ghost_encryption_key" {
  secret_id  = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.ghost_newsletter_credentials_encryption_key]
}

resource "google_secret_manager_secret_iam_member" "call_node_function_guest_token_secret" {
  secret_id  = google_secret_manager_secret.guest_token_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.guest_token_secret]
}
