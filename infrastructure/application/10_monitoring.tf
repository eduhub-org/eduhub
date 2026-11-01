###############################################################################
# Error alerting
#####
# Posts to Slack when any Cloud Run service (Hasura, Keycloak, the frontends
# and the gen2 cloud functions) logs an error, so a feature broken by a release
# is noticed without waiting for a user to complain.
#
# Hasura writes its own JSON "level" field, which Cloud Logging does not map to
# "severity". A failing GraphQL mutation therefore only shows up through
# jsonPayload.level, so the filter checks both.
#
# Excluded as expected noise: Hasura "not-found" (bots probing /.env,
# /wordpress/, ...), Hasura "invalid-jwt" (expired sessions) and NextAuth's
# 400 from Keycloak when a refresh token has expired.

resource "google_monitoring_alert_policy" "service_errors" {
  count = var.alert_slack_channel_id == "" ? 0 : 1

  display_name = "EduHub service errors (${var.project_id})"
  combiner     = "OR"

  conditions {
    display_name = "Error in Cloud Run logs"
    condition_matched_log {
      filter = <<-EOT
        resource.type="cloud_run_revision"
        AND (severity>=ERROR OR jsonPayload.level="error")
        AND NOT jsonPayload.detail.operation.error.code="not-found"
        AND NOT jsonPayload.detail.operation.error.code="invalid-jwt"
        AND NOT (textPayload:"AxiosError" AND textPayload:"status code 400" AND textPayload:"[...nextauth]")
      EOT
      label_extractors = {
        "service" = "EXTRACT(resource.labels.service_name)"
      }
    }
  }

  notification_channels = [var.alert_slack_channel_id]

  alert_strategy {
    # At most one Slack message per 30 minutes; a broken feature that keeps
    # failing must not flood the channel.
    notification_rate_limit {
      period = "1800s"
    }
    auto_close = "3600s"
  }

  documentation {
    mime_type = "text/markdown"
    content   = "An EduHub service logged an error in `${var.project_id}`. Open the incident for the matching log entry, or Logs Explorer filtered on the service and `severity>=ERROR OR jsonPayload.level=\"error\"`."
  }
}

###############################################################################
# Cost alerting
#####
# A budget whose amount is last month's actual spend, so the threshold of 110%
# fires when the current month's forecast is more than 10% above it. Google
# sends one notification per threshold and month.
#
# Budgets only notify email channels (Slack is not supported there), so the
# alert goes to the addresses in alert_budget_emails, at most five.
#
# Budgets belong to the billing account, not the project: the Terraform service
# account needs roles/billing.costsManager on it (granted for production on
# 2026-10-20). In a workspace whose service account lacks that role, set
# enable_budget_alert to false or the apply fails. The Budget API also
# needs a quota project when called by a service account, hence the aliased
# provider with user_project_override.

provider "google" {
  alias                 = "billing"
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

locals {
  budget_alert_enabled = var.enable_budget_alert && length(var.alert_budget_emails) > 0
}

resource "google_monitoring_notification_channel" "budget_email" {
  for_each = local.budget_alert_enabled ? toset(var.alert_budget_emails) : toset([])

  display_name = "EduHub budget alert: ${each.value}"
  type         = "email"
  labels = {
    email_address = each.value
  }
}

resource "google_project_service" "billing_budgets" {
  count = local.budget_alert_enabled ? 1 : 0

  service            = "billingbudgets.googleapis.com"
  disable_on_destroy = false
}

resource "google_billing_budget" "monthly_increase" {
  count    = local.budget_alert_enabled ? 1 : 0
  provider = google.billing

  billing_account = data.google_project.eduhub.billing_account
  display_name    = "EduHub spend vs. last month (${var.project_id})"

  budget_filter {
    projects        = ["projects/${data.google_project.eduhub.number}"]
    calendar_period = "MONTH"
  }

  amount {
    last_period_amount = true
  }

  threshold_rules {
    threshold_percent = 1.1
    spend_basis       = "FORECASTED_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [for c in google_monitoring_notification_channel.budget_email : c.id]
  }

  depends_on = [google_project_service.billing_budgets]
}
