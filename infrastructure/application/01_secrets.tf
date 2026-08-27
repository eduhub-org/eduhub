###############################################################################
# Secret Manager Resources
###############################################################################
#
# This file defines:
#
# 1. All Google Secret Manager secrets used across the application
#    - Authentication secrets (NextAuth, Keycloak)
#    - Database credentials
#    - API keys (Zoom, Mailgun)
#    - Service communication secrets (Cloud Functions, Hasura)
#
# 2. Secret versions for each secret
#    - Each secret has a corresponding version resource that contains the actual data
#    - Some secrets contain constructed values, others reference variables
#
# 3. IAM bindings for the default compute engine service account
#    - All IAM bindings that grant the default compute service account 
#      (${project_number}-compute@developer.gserviceaccount.com) access to secrets
#      are centralized here
#    - This provides a single place to audit all secret access for this account
#
# NOTE: Service-specific IAM bindings for other service accounts should be kept
# in their respective service files (e.g., 04_keycloak.tf, 05_hasura.tf) for better
# organization and to keep service configurations self-contained.
###############################################################################



# ===== NextAuth Secret =====
resource "google_secret_manager_secret" "nextauth_secret" {
  provider  = google-beta
  secret_id = "nextauth-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  provider    = google-beta
  secret      = google_secret_manager_secret.nextauth_secret.name
  secret_data = var.nextauth_secret
}

# ===== Keycloak Hasura Client Secret =====
resource "google_secret_manager_secret" "keycloak_hasura_client_secret" {
  provider  = google-beta
  secret_id = "keycloak-hasura-client-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "keycloak_hasura_client_secret" {
  provider    = google-beta
  secret      = google_secret_manager_secret.keycloak_hasura_client_secret.name
  secret_data = var.keycloak_hasura_client_secret
}

# ===== Keycloak Admin Password =====
resource "google_secret_manager_secret" "keycloak_pw" {
  provider  = google-beta
  secret_id = "keycloak-pw"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "keycloak_pw" {
  provider    = google-beta
  secret      = google_secret_manager_secret.keycloak_pw.name
  secret_data = var.keycloak_pw
}

# ===== Keycloak DB Password =====
resource "google_secret_manager_secret" "keycloak_db_pw" {
  provider  = google-beta
  secret_id = "keycloak-db-pw"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "keycloak_db_pw" {
  provider    = google-beta
  secret      = google_secret_manager_secret.keycloak_db_pw.name
  secret_data = var.keycloak_db_pw
}

# ===== Hasura Cloud Function Secret =====
resource "google_secret_manager_secret" "cloud_function" {
  provider  = google-beta
  secret_id = "cloud-function"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "cloud_function" {
  provider    = google-beta
  secret      = google_secret_manager_secret.cloud_function.name
  secret_data = var.hasura_cloud_function_secret
}

# ===== Hasura GraphQL Admin Key =====
resource "google_secret_manager_secret" "hasura_graphql_admin_key" {
  provider  = google-beta
  secret_id = "hasura-graphql-admin-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "hasura_graphql_admin_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.hasura_graphql_admin_key.name
  secret_data = var.hasura_graphql_admin_key
}

# ===== Hasura DB URL =====
resource "google_secret_manager_secret" "hasura_db_url" {
  provider  = google-beta
  secret_id = "hasura-db-url"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "hasura_db_url" {
  provider    = google-beta
  secret      = google_secret_manager_secret.hasura_db_url.name
  secret_data = "postgres://${var.hasura_db_user}:${var.hasura_db_pw}@${google_sql_database_instance.default.private_ip_address}:5432/${google_sql_database.hasura.name}"
}

# ===== Cloud Function Secrets =====
resource "google_secret_manager_secret" "zoom_api_key" {
  provider  = google-beta
  secret_id = "zoom-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "zoom_api_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.zoom_api_key.name
  secret_data = var.zoom_api_key
}

resource "google_secret_manager_secret" "zoom_api_secret" {
  provider  = google-beta
  secret_id = "zoom-api-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "zoom_api_secret" {
  provider    = google-beta
  secret      = google_secret_manager_secret.zoom_api_secret.name
  secret_data = var.zoom_api_secret
}

resource "google_secret_manager_secret" "lms_password" {
  provider  = google-beta
  secret_id = "lms-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "lms_password" {
  provider    = google-beta
  secret      = google_secret_manager_secret.lms_password.name
  secret_data = var.lms_password
}

resource "google_secret_manager_secret" "mm_token" {
  provider  = google-beta
  secret_id = "mm-token"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "mm_token" {
  provider    = google-beta
  secret      = google_secret_manager_secret.mm_token.name
  secret_data = var.mm_token
}

# ===== Hasura Mail Password =====
resource "google_secret_manager_secret" "hasura_mail_pw" {
  provider  = google-beta
  secret_id = "hasura-mail-pw"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "hasura_mail_pw" {
  provider    = google-beta
  secret      = google_secret_manager_secret.hasura_mail_pw.name
  secret_data = var.hasura_mail_pw
}

# ===== Mailgun API Key =====
resource "google_secret_manager_secret" "mailgun_api_key" {
  provider  = google-beta
  secret_id = "mailgun-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "mailgun_api_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.mailgun_api_key.name
  secret_data = var.mailgun_api_key
}

# ===== Formbricks API Key =====
resource "google_secret_manager_secret" "formbricks_api_key" {
  provider  = google-beta
  secret_id = "formbricks-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "formbricks_api_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.formbricks_api_key.name
  secret_data = var.formbricks_api_key
}

# ===== Ghost Newsletter Credentials Encryption Key =====
resource "google_secret_manager_secret" "ghost_newsletter_credentials_encryption_key" {
  provider  = google-beta
  secret_id = "ghost-newsletter-credentials-encryption-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "ghost_newsletter_credentials_encryption_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.name
  secret_data = var.ghost_newsletter_credentials_encryption_key
}

# ===== Stripe Secret Key =====
resource "google_secret_manager_secret" "stripe_secret_key" {
  provider  = google-beta
  secret_id = "stripe-secret-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_secret_key" {
  provider    = google-beta
  secret      = google_secret_manager_secret.stripe_secret_key.name
  secret_data = var.stripe_secret_key
}

# ===== Stripe Webhook Secret =====
resource "google_secret_manager_secret" "stripe_webhook_secret" {
  provider  = google-beta
  secret_id = "stripe-webhook-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret" {
  provider    = google-beta
  secret      = google_secret_manager_secret.stripe_webhook_secret.name
  secret_data = var.stripe_webhook_secret
}

# ===== Matrix Admin Access Token =====
resource "google_secret_manager_secret" "matrix_admin_access_token" {
  provider  = google-beta
  secret_id = "matrix-admin-access-token"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "matrix_admin_access_token" {
  provider    = google-beta
  secret      = google_secret_manager_secret.matrix_admin_access_token.name
  secret_data = var.matrix_admin_access_token
}

# =========================================================================================
# IAM bindings for default compute engine service account
# =========================================================================================
resource "google_secret_manager_secret_iam_member" "nextauth_secret" {
  secret_id  = google_secret_manager_secret.nextauth_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.nextauth_secret]
}

resource "google_secret_manager_secret_iam_member" "keycloak_hasura_client_secret" {
  secret_id  = google_secret_manager_secret.keycloak_hasura_client_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.keycloak_hasura_client_secret]
}

resource "google_secret_manager_secret_iam_member" "hasura_graphql_admin_key" {
  secret_id  = google_secret_manager_secret.hasura_graphql_admin_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_graphql_admin_key]
}

resource "google_secret_manager_secret_iam_member" "hasura_db_url" {
  secret_id  = google_secret_manager_secret.hasura_db_url.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_db_url]
}

resource "google_secret_manager_secret_iam_member" "keycloak_pw" {
  secret_id  = google_secret_manager_secret.keycloak_pw.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.keycloak_pw]
}

resource "google_secret_manager_secret_iam_member" "keycloak_db_pw" {
  secret_id  = google_secret_manager_secret.keycloak_db_pw.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.keycloak_db_pw]
}

resource "google_secret_manager_secret_iam_member" "cloud_function" {
  secret_id  = google_secret_manager_secret.cloud_function.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.cloud_function]
}

resource "google_secret_manager_secret_iam_member" "hasura_mail_pw" {
  secret_id  = google_secret_manager_secret.hasura_mail_pw.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.hasura_mail_pw]
}

resource "google_secret_manager_secret_iam_member" "mailgun_api_key" {
  secret_id  = google_secret_manager_secret.mailgun_api_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.mailgun_api_key]
}

resource "google_secret_manager_secret_iam_member" "formbricks_api_key" {
  secret_id  = google_secret_manager_secret.formbricks_api_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.formbricks_api_key]
}

resource "google_secret_manager_secret_iam_member" "ghost_newsletter_credentials_encryption_key" {
  secret_id  = google_secret_manager_secret.ghost_newsletter_credentials_encryption_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.ghost_newsletter_credentials_encryption_key]
}

resource "google_secret_manager_secret_iam_member" "stripe_secret_key" {
  secret_id  = google_secret_manager_secret.stripe_secret_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.stripe_secret_key]
}

resource "google_secret_manager_secret_iam_member" "stripe_webhook_secret" {
  secret_id  = google_secret_manager_secret.stripe_webhook_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
  depends_on = [google_secret_manager_secret.stripe_webhook_secret]
}

# The edu Cloud Run service hosts the Stripe webhook handler and sets no
# service_account_name, so it runs as the default compute service account —
# the two bindings above only cover the cloud function. These bindings are
# per-member, so granting the compute account does not revoke that access.
resource "google_secret_manager_secret_iam_member" "stripe_secret_key_eduhub" {
  secret_id  = google_secret_manager_secret.stripe_secret_key.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.stripe_secret_key]
}

resource "google_secret_manager_secret_iam_member" "stripe_webhook_secret_eduhub" {
  secret_id  = google_secret_manager_secret.stripe_webhook_secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.stripe_webhook_secret]
}
