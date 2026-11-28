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
#
# The errors are split by log shape into one policy per category, so each
# Slack message names what failed (error code, message, trigger, HTTP status)
# instead of only "a service logged an error". Each category's label
# extractors only read fields its log entries always have. Every
# distinct combination of extracted labels is its own alert in Cloud
# Monitoring, so the same error repeats at most every 30 minutes while a new,
# different error still gets its own message. That is why the labels avoid ids
# and cut free texts short. Cloud Monitoring caps a log-based policy at
# 20 notifications a day.
#
# The categories are tried in order: each matches only what no earlier one
# matched, and "other" takes the rest. That way the split loses no error the
# single filter used to catch. In the documentation, `$${...}` is a Cloud
# Monitoring variable (the `$$` escapes Terraform's interpolation).

locals {
  service_error_filter = <<-EOT
    resource.type="cloud_run_revision"
    AND (severity>=ERROR OR jsonPayload.level="error")
    AND NOT jsonPayload.detail.operation.error.code="not-found"
    AND NOT jsonPayload.detail.operation.error.code="invalid-jwt"
    AND NOT (textPayload:"AxiosError" AND textPayload:"status code 400" AND textPayload:"[...nextauth]")
    AND NOT textPayload:"${local.assistant_unauthorized_log}"
  EOT

  service_error_logs_hint = "Open the incident for the matching log entry, or Logs Explorer in `${var.project_id}` filtered on the service and `severity>=ERROR OR jsonPayload.level=\"error\"`."

  service_error_categories = [
    {
      # Hasura's log of a failed GraphQL request. The error message is
      # Hasura's own text (no ids); the operation name is missing for
      # unnamed queries.
      key      = "graphql"
      name     = "GraphQL request failed"
      selector = "jsonPayload.type=\"http-log\""
      labels = {
        "code"      = "EXTRACT(jsonPayload.detail.operation.error.code)"
        "message"   = "REGEXP_EXTRACT(jsonPayload.detail.operation.error.error, \"^(.{1,150})\")"
        "operation" = "EXTRACT(jsonPayload.detail.operation.query.operationName)"
      }
      subject = "Hasura $${log.extracted_label.code}: $${log.extracted_label.message}"
      content = <<-EOT
        **Hasura rejected a GraphQL request** in `${var.project_id}`.

        - Code: `$${log.extracted_label.code}`
        - Error: $${log.extracted_label.message}
        - Operation: `$${log.extracted_label.operation}`

        `validation-failed` with "not found in type" usually means a frontend still sends a query for a field the schema no longer has (an old browser tab after a release, or a missing migration). `access-denied` and `permission-error` point at a role or permission, `constraint-violation` at data the database refused.
      EOT
    },
    {
      # An event or cron trigger whose webhook failed or timed out. The
      # message holds the event id, so only the trigger name is extracted.
      key      = "trigger"
      name     = "Hasura trigger failed"
      selector = "jsonPayload.type=(\"event-trigger\" OR \"scheduled-trigger\")"
      labels = {
        "kind"    = "EXTRACT(jsonPayload.type)"
        "trigger" = "REGEXP_EXTRACT(jsonPayload.detail.error, \"rigger .([A-Za-z0-9_]+)\")"
        "code"    = "EXTRACT(jsonPayload.detail.code)"
      }
      subject = "Hasura $${log.extracted_label.kind} $${log.extracted_label.trigger}: $${log.extracted_label.code}"
      content = <<-EOT
        **A Hasura trigger failed** in `${var.project_id}`.

        - Trigger: `$${log.extracted_label.trigger}` ($${log.extracted_label.kind})
        - Code: `$${log.extracted_label.code}`

        A `timeout` means the cloud function behind the trigger answered too late or not at all: check that function's logs at the same time. Hasura retries according to the trigger's retry_conf in `backend/metadata`.
      EOT
    },
    {
      # Structured logs of our own code: the cloud functions (winston) and
      # the media service. Many messages carry an id or a number
      # ("... for user <id>", "courseId: 42", "sessionSpeakerId=17"), which
      # would make every occurrence its own alert. So the label keeps the
      # words up to the first one containing a digit or "=", at most 20.
      key      = "app"
      name     = "Application error"
      selector = "jsonPayload.message:*"
      labels = {
        "service" = "EXTRACT(resource.labels.service_name)"
        "message" = "REGEXP_EXTRACT(jsonPayload.message, \"^((?:[^[:space:]0-9:=]+(?:[[:space:]]+|:[[:space:]]*|$)){1,20})\")"
      }
      subject = "$${log.extracted_label.service}: $${log.extracted_label.message}"
      content = <<-EOT
        **`$${log.extracted_label.service}` logged an error** in `${var.project_id}`:

        > $${log.extracted_label.message}

        Search the code for the message to find where it is logged; the log entry holds the details (error, ids).
      EOT
    },
    {
      # Plain text: Next.js console.error, Keycloak, and Cloud Run's own
      # messages (instance start failures, timeouts; these are also request
      # logs with a 5xx, so this category comes before "request"). The first
      # line, without a leading timestamp, names the error.
      key      = "text"
      name     = "Error text in logs"
      selector = "textPayload:*"
      labels = {
        "service" = "EXTRACT(resource.labels.service_name)"
        "line"    = "REGEXP_EXTRACT(textPayload, \"^(?:[0-9-]+[ T][0-9:.,]+Z? +)?(.{1,150})\")"
      }
      subject = "$${log.extracted_label.service}: $${log.extracted_label.line}"
      content = <<-EOT
        **`$${log.extracted_label.service}` logged an error** in `${var.project_id}`:

        > $${log.extracted_label.line}

        "The request was aborted after waiting too long for an available instance" and "failed to start" come from Cloud Run (no free instance, a crash at boot), not from our code.
      EOT
    },
    {
      # A request Cloud Run answered with 5xx (requests log) and no text to
      # explain it. The path is left out, as it often holds ids. The status
      # needs the existence check: on an entry without httpRequest,
      # NOT (httpRequest.status>=500) is false, so the categories after this
      # one would never match.
      key      = "request"
      name     = "Request failed with 5xx"
      selector = "httpRequest.status:* AND httpRequest.status>=500"
      labels = {
        "service" = "EXTRACT(resource.labels.service_name)"
        "status"  = "EXTRACT(httpRequest.status)"
        "method"  = "EXTRACT(httpRequest.requestMethod)"
      }
      subject = "$${log.extracted_label.service}: HTTP $${log.extracted_label.status} on $${log.extracted_label.method}"
      content = <<-EOT
        **`$${log.extracted_label.service}` answered a $${log.extracted_label.method} request with HTTP $${log.extracted_label.status}** in `${var.project_id}`.

        The incident's log entry shows the URL. A 500 next to an application error at the same time is that error; on its own (e.g. HEAD requests from probes) it is often noise. 502/503/504 mean the container was not reachable, crashed or timed out.
      EOT
    },
    {
      # Everything no category above matched, e.g. Hasura's websocket and
      # internal errors.
      key      = "other"
      name     = "Other error"
      selector = null
      labels = {
        "service" = "EXTRACT(resource.labels.service_name)"
      }
      subject = "$${log.extracted_label.service}: error"
      content = <<-EOT
        **`$${log.extracted_label.service}` logged an error** in `${var.project_id}`.
      EOT
    },
  ]

  service_error_selectors = compact([for c in local.service_error_categories : c.selector])

  service_error_policies = {
    for index, c in local.service_error_categories : c.key => merge(c, {
      filter = join("\n", concat(
        [trimspace(local.service_error_filter)],
        c.selector == null ? [] : ["AND (${c.selector})"],
        [for s in slice(local.service_error_selectors, 0, c.selector == null ? length(local.service_error_selectors) : index) : "AND NOT (${s})"],
      ))
    })
  }
}

resource "google_monitoring_alert_policy" "service_errors" {
  for_each = var.alert_slack_channel_id == "" ? {} : local.service_error_policies

  display_name = "EduHub service errors: ${each.value.name} (${var.project_id})"
  combiner     = "OR"

  conditions {
    display_name = each.value.name
    condition_matched_log {
      filter           = each.value.filter
      label_extractors = each.value.labels
    }
  }

  notification_channels = [var.alert_slack_channel_id]

  alert_strategy {
    # The same error (same labels) at most once per 30 minutes; a broken
    # feature that keeps failing must not flood the channel.
    notification_rate_limit {
      period = "1800s"
    }
    auto_close = "3600s"
  }

  documentation {
    mime_type = "text/markdown"
    subject   = each.value.subject
    content   = "${trimspace(each.value.content)}\n\n${local.service_error_logs_hint}"
  }
}

# The single policy before the split becomes the catch-all, so it is updated
# in place instead of being deleted and recreated.
moved {
  from = google_monitoring_alert_policy.service_errors[0]
  to   = google_monitoring_alert_policy.service_errors["other"]
}

###############################################################################
# Assistant credentials alert
#####
# The provider refusing the Assistant's credentials (HTTP 401/403) means the
# IONOS token expired (its TTL is at most 365 days), was revoked or was pasted
# incompletely; on vertex, the service account lost its role. Every chat then
# fails, so this gets its own Slack message saying what to do, and the generic
# error alert above leaves the line out. The app logs it from
# frontend-nx/apps/edu-hub/lib/assistant/chat.ts.

locals {
  assistant_unauthorized_log = "Assistant: the model call failed: PROVIDER_UNAUTHORIZED"
}

resource "google_monitoring_alert_policy" "assistant_unauthorized" {
  count = var.alert_slack_channel_id != "" && var.assistant_llm_provider != "" ? 1 : 0

  display_name = "EduHub Assistant: provider rejects the credentials (${var.project_id})"
  combiner     = "OR"

  conditions {
    display_name = "PROVIDER_UNAUTHORIZED in the edu service's logs"
    condition_matched_log {
      filter = <<-EOT
        resource.type="cloud_run_revision"
        AND resource.labels.service_name="${google_cloud_run_service.eduhub.name}"
        AND textPayload:"${local.assistant_unauthorized_log}"
      EOT
    }
  }

  notification_channels = [var.alert_slack_channel_id]

  alert_strategy {
    # Every chat fails the same way until the key is replaced: one message a day.
    notification_rate_limit {
      period = "86400s"
    }
    auto_close = "86400s"
  }

  documentation {
    mime_type = "text/markdown"
    content   = <<-EOT
      The Assistant's provider (`${var.assistant_llm_provider}`) rejects its credentials in `${var.project_id}`, so every chat fails.

      - **ionos:** the AI Model Hub token has most likely expired (TTL at most 365 days). Create a new token in the IONOS Token Manager, put its value into `assistant_llm_api_key` (variable set `eduhub-application`) and redeploy. See "Renewing the IONOS token" in `infrastructure/README.md`.
      - **vertex:** check that the default compute service account still has `roles/aiplatform.user`.
    EOT
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

###############################################################################
# Cloud function dashboard
#####
# Request latency (p95), instances and request rate per cloud function unit,
# so a split of a unit (e.g. interactive vs background handlers of
# callNodeFunction, docs/adr/0002-function-units-by-secret-scope.md) is
# decided on data. Gen2 functions run on Cloud Run, hence the run.googleapis.com
# metrics on cloud_run_revision.

locals {
  cloud_function_service_filter = format(
    "resource.type=\"cloud_run_revision\" AND resource.label.\"service_name\"=one_of(%s)",
    join(",", [for unit in module.cloud_function : format("\"%s\"", unit.name)])
  )

  cloud_function_dashboard_charts = [
    {
      # request_latencies is a DELTA distribution with one series per
      # response code. ALIGN_DELTA keeps each series a distribution, and
      # REDUCE_PERCENTILE_95 takes the p95 of their merged distribution per
      # service. A per-series p95 reduced with MAX would report the slowest
      # response code's p95 instead, e.g. a handful of slow 500s.
      title     = "Request latency p95 (ms)"
      metric    = "run.googleapis.com/request_latencies"
      aligner   = "ALIGN_DELTA"
      reducer   = "REDUCE_PERCENTILE_95"
      plot_type = "LINE"
      y_label   = "ms"
    },
    {
      title     = "Instances"
      metric    = "run.googleapis.com/container/instance_count"
      aligner   = "ALIGN_MAX"
      reducer   = "REDUCE_SUM"
      plot_type = "STACKED_AREA"
      y_label   = "instances"
    },
    {
      title     = "Requests per second"
      metric    = "run.googleapis.com/request_count"
      aligner   = "ALIGN_RATE"
      reducer   = "REDUCE_SUM"
      plot_type = "LINE"
      y_label   = "req/s"
    },
  ]
}

resource "google_monitoring_dashboard" "cloud_functions" {
  dashboard_json = jsonencode({
    displayName = "EduHub cloud functions (${var.project_id})"
    mosaicLayout = {
      columns = 12
      tiles = [
        for index, chart in local.cloud_function_dashboard_charts : {
          xPos   = 0
          yPos   = index * 4
          width  = 12
          height = 4
          widget = {
            title = chart.title
            xyChart = {
              dataSets = [{
                plotType = chart.plot_type
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"${chart.metric}\" AND ${local.cloud_function_service_filter}"
                    aggregation = {
                      alignmentPeriod    = "60s"
                      perSeriesAligner   = chart.aligner
                      crossSeriesReducer = chart.reducer
                      groupByFields      = ["resource.label.\"service_name\""]
                    }
                  }
                }
              }]
              yAxis = {
                label = chart.y_label
                scale = "LINEAR"
              }
            }
          }
        }
      ]
    }
  })
}
