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
