###############################################################################
# GitHub sync of Assistant reports (follow-up to issue #2234)
#####
# Approved reports become issues in var.github_issue_repo, created by the "EduHub Reports" GitHub
# App. The edu service creates and updates issues (/api/manage/reports/github) and receives the
# App's webhook (/api/webhooks/github); callNodeFunction's reconcileIssueReportsWithGithub
# catches up nightly. Both need the App's private key; only the edu service needs the webhook
# secret. Without the full configuration nothing is created and the sync stays off, so a
# missing key never blocks a deploy (like the Assistant's API key in 11_assistant.tf).

locals {
  github_reports_enabled = (
    var.github_app_id != "" && var.github_app_installation_id != "" && var.github_issue_repo != "" &&
    nonsensitive(var.github_app_private_key != "") && nonsensitive(var.github_app_webhook_secret != "")
  )
  # Plain settings for both services; empty while the sync is off.
  github_reports_env = local.github_reports_enabled ? {
    GITHUB_APP_ID              = var.github_app_id
    GITHUB_APP_INSTALLATION_ID = var.github_app_installation_id
    GITHUB_ISSUE_REPO          = var.github_issue_repo
    GITHUB_PROJECT_NUMBER      = var.github_project_number == null ? "" : tostring(var.github_project_number)
  } : {}
  github_reports_function_secrets = local.github_reports_enabled ? [{
    key       = "GITHUB_APP_PRIVATE_KEY"
    secret_id = google_secret_manager_secret.github_app_private_key[0].secret_id
    id        = google_secret_manager_secret.github_app_private_key[0].id
  }] : []
  # The edu service's secret env vars: name => secret.
  github_reports_edu_secrets = local.github_reports_enabled ? {
    GITHUB_APP_PRIVATE_KEY    = google_secret_manager_secret.github_app_private_key[0].secret_id
    GITHUB_APP_WEBHOOK_SECRET = google_secret_manager_secret.github_app_webhook_secret[0].secret_id
  } : {}
}

resource "google_secret_manager_secret" "github_app_private_key" {
  count     = local.github_reports_enabled ? 1 : 0
  provider  = google-beta
  secret_id = "github-app-private-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "github_app_private_key" {
  count       = local.github_reports_enabled ? 1 : 0
  provider    = google-beta
  secret      = google_secret_manager_secret.github_app_private_key[0].name
  secret_data = var.github_app_private_key
}

resource "google_secret_manager_secret" "github_app_webhook_secret" {
  count     = local.github_reports_enabled ? 1 : 0
  provider  = google-beta
  secret_id = "github-app-webhook-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "github_app_webhook_secret" {
  count       = local.github_reports_enabled ? 1 : 0
  provider    = google-beta
  secret      = google_secret_manager_secret.github_app_webhook_secret[0].name
  secret_data = var.github_app_webhook_secret
}

# The edu service runs as the default compute service account.
resource "google_secret_manager_secret_iam_member" "github_app_private_key_eduhub" {
  count     = local.github_reports_enabled ? 1 : 0
  secret_id = google_secret_manager_secret.github_app_private_key[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "github_app_webhook_secret_eduhub" {
  count     = local.github_reports_enabled ? 1 : 0
  secret_id = google_secret_manager_secret.github_app_webhook_secret[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
}

# callNodeFunction's shared account, for the nightly reconcile.
resource "google_secret_manager_secret_iam_member" "github_app_private_key_functions" {
  count     = local.github_reports_enabled ? 1 : 0
  secret_id = google_secret_manager_secret.github_app_private_key[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}
