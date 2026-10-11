###############################################################################
# Error alerting
#
# A log-based alert policy that mails var.alert_email when any Cloud Run
# service of this deployment (Keycloak, Hasura, edu-hub, StuJo and the gen2
# Cloud Functions, which also run as Cloud Run revisions) logs an error.
# Cloud Monitoring evaluates the logs continuously, so no cron job is needed;
# notification_rate_limit caps the mails at one per hour and service.
#
# Disabled while var.alert_email is empty.
#####

locals {
  alerting_enabled = var.alert_email != ""

  # - severity>=ERROR: Python logging.error, structured logs with an ERROR
  #   severity, and Cloud Run's own request log for 5xx responses.
  # - Hasura logs JSON with "level" instead of "severity", so Cloud Logging
  #   files its errors as DEFAULT. GraphQL errors (failed mutations such as a
  #   course application) are only visible through jsonPayload.level.
  #   Expired/invalid JWTs are client-side noise and are left out.
  # Tune this filter in Logs Explorer before tightening or widening it.
  error_log_filter = <<-EOT
    resource.type="cloud_run_revision"
    (
      severity>=ERROR
      OR jsonPayload.level="error"
    )
    -"invalid-jwt"
    -"JWTExpired"
  EOT
}

resource "google_monitoring_notification_channel" "error_alert_email" {
  count        = local.alerting_enabled ? 1 : 0
  display_name = "EduHub error alerts${var.service_name_extension}"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_alert_policy" "service_errors" {
  count        = local.alerting_enabled ? 1 : 0
  display_name = "Errors in EduHub services${var.service_name_extension}"
  combiner     = "OR"

  conditions {
    display_name = "Error log entry"
    condition_matched_log {
      filter = local.error_log_filter
      # One incident (and one mail) per service, so an error in Hasura does
      # not hide a simultaneous one in the frontend.
      label_extractors = {
        "service" = "EXTRACT(resource.labels.service_name)"
      }
    }
  }

  alert_strategy {
    notification_rate_limit {
      period = "3600s"
    }
    auto_close = "1800s"
  }

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      An EduHub service (${var.environment}) logged an error. Open the
      matching entries in Logs Explorer with this filter:

      ```
      ${trimspace(local.error_log_filter)}
      ```
    EOT
  }

  notification_channels = [google_monitoring_notification_channel.error_alert_email[0].id]
}
