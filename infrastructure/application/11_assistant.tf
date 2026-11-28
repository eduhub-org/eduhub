###############################################################################
# Assistant (ADR 0005, ADR 0008): an OpenAI-compatible LLM processed in the EU,
# either on the IONOS AI Model Hub (ionos) or Gemini on Vertex AI (vertex)
#####
# The Assistant's backend runs in the edu service (a Next.js API route) and
# calls the provider's OpenAI-compatible Chat Completions API. The edu service
# runs as the default compute service account, so that account gets
# roles/aiplatform.user for Vertex and read access to the API key otherwise. The aiplatform API is enabled in 06_cloud-functions.tf.
#
# Zero retention on Google's side (issue #2191):
# - Request-response logging is off unless a PublisherModelConfig turns it on;
#   nothing here does.
# - Caching is a project setting that google provider 6.x can't manage
#   (google_vertex_ai_cache_config needs a newer major version). It is turned
#   off once per project with the command in infrastructure/README.md.
# - No Grounding with Google Search: the backend never requests it.

locals {
  assistant_llm_host = (
    var.assistant_llm_location == "eu"
    ? "aiplatform.eu.rep.googleapis.com"
    : "${var.assistant_llm_location}-aiplatform.googleapis.com"
  )
  assistant_vertex_base_url = "https://${local.assistant_llm_host}/v1/projects/${var.project_id}/locations/${var.assistant_llm_location}/endpoints/openapi"

  # IONOS AI Model Hub (ADR 0008): OpenAI-compatible, processed in Germany, with
  # a static API key. The app's generic "openai" provider speaks to it.
  assistant_ionos_base_url = "https://openai.inference.de-txl.ionos.com/v1"

  assistant_llm_base_url = var.assistant_llm_provider == "ionos" ? local.assistant_ionos_base_url : local.assistant_vertex_base_url
  # ASSISTANT_LLM_PROVIDER as the app reads it (lib/assistant/config.ts).
  assistant_app_provider = var.assistant_llm_provider == "ionos" ? "openai" : var.assistant_llm_provider
  assistant_llm_model = var.assistant_llm_model != "" ? var.assistant_llm_model : (
    var.assistant_llm_provider == "ionos" ? "Qwen/Qwen3.8-27B" : "google/gemini-3.8-flash"
  )
  # The key is used only with a provider that needs one: the variable set shares it with
  # every workspace, and on vertex it would replace the service account's token. Only
  # whether it is set decides what to create; the key itself stays sensitive.
  assistant_has_api_key = var.assistant_llm_provider == "ionos" && nonsensitive(var.assistant_llm_api_key != "")

  # Weekly issue report summary (issue #2234): callNodeFunction's generateIssueReportSummary, with
  # its own (typically stronger) model at the same kind of EU provider. On ionos it reuses the
  # Assistant's API key secret, so it needs the Assistant on ionos with a key.
  summary_llm_host = (
    var.summary_llm_location == "eu"
    ? "aiplatform.eu.rep.googleapis.com"
    : "${var.summary_llm_location}-aiplatform.googleapis.com"
  )
  # Empty summary_llm_provider follows the Assistant: ionos when it runs there with a key.
  summary_provider = (
    var.summary_llm_provider == "" ? (local.assistant_has_api_key ? "ionos" : "off") : var.summary_llm_provider
  )
  summary_llm_base_url = local.summary_provider == "ionos" ? local.assistant_ionos_base_url : (
    "https://${local.summary_llm_host}/v1/projects/${var.project_id}/locations/${var.summary_llm_location}/endpoints/openapi"
  )
  summary_llm_model = var.summary_llm_model != "" ? var.summary_llm_model : (
    local.summary_provider == "ionos" ? "Qwen/Qwen3.5-397B-A17B" : ""
  )
  summary_has_api_key = local.summary_provider == "ionos" && local.assistant_has_api_key
  # Empty while the summary is off (no SUMMARY_LLM_PROVIDER: the function writes nothing).
  summary_env = { for name, value in {
    # lib/summaryLlm.js: "openai" is any OpenAI-compatible endpoint with a key.
    SUMMARY_LLM_PROVIDER = local.summary_provider == "ionos" ? "openai" : local.summary_provider
    SUMMARY_LLM_BASE_URL = local.summary_llm_base_url
    SUMMARY_LLM_MODEL    = local.summary_llm_model
    # Qwen3.5 397B thinks by default, and its thinking counts against the output cap and could
    # outrun callNodeFunction's 180 s, so it is turned off.
    SUMMARY_LLM_EXTRA_BODY                = local.summary_provider == "ionos" ? jsonencode({ reasoning_effort = "none" }) : ""
    SUMMARY_LLM_PRICE_INPUT_EUR_PER_MTOK  = var.summary_llm_price_input_eur_per_mtok == null ? "" : tostring(var.summary_llm_price_input_eur_per_mtok)
    SUMMARY_LLM_PRICE_OUTPUT_EUR_PER_MTOK = var.summary_llm_price_output_eur_per_mtok == null ? "" : tostring(var.summary_llm_price_output_eur_per_mtok)
    # The summary also analyses the week's production errors (lib/errorLogs.js): the entries
    # the Slack error alert matches (10_monitoring.tf), read with roles/logging.viewer below.
    ERROR_LOG_PROJECT = var.project_id
    ERROR_LOG_FILTER  = local.service_error_filter
  } : name => value if local.summary_provider != "off" }
  summary_secrets = local.summary_has_api_key ? [{
    key       = "SUMMARY_LLM_API_KEY"
    secret_id = google_secret_manager_secret.assistant_llm_api_key[0].secret_id
    id        = google_secret_manager_secret.assistant_llm_api_key[0].id
  }] : []
}

# callNodeFunction's shared account reads the IONOS key for the weekly summary. On vertex it uses
# its own token: the account already has roles/aiplatform.user for the expert search embeddings.
resource "google_secret_manager_secret_iam_member" "summary_llm_api_key" {
  count     = local.summary_has_api_key ? 1 : 0
  secret_id = google_secret_manager_secret.assistant_llm_api_key[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

# The weekly summary reads the production error logs. The shared account (also callPythonFunction
# and apiProxy) can then read the project's logs; Data Access audit logs need
# roles/logging.privateLogViewer and stay closed.
resource "google_project_iam_member" "summary_logs_viewer" {
  count   = local.summary_provider != "off" ? 1 : 0
  project = var.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.custom_cloud_function_account.email}"
}

# The provider's API key, for providers other than Vertex AI (which uses the
# service account's token). Without a key nothing is created and the app
# reports the Assistant as misconfigured, so a missing key never blocks a deploy.
resource "google_secret_manager_secret" "assistant_llm_api_key" {
  count     = local.assistant_has_api_key ? 1 : 0
  provider  = google-beta
  secret_id = "assistant-llm-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "assistant_llm_api_key" {
  count       = local.assistant_has_api_key ? 1 : 0
  provider    = google-beta
  secret      = google_secret_manager_secret.assistant_llm_api_key[0].name
  secret_data = var.assistant_llm_api_key
}

resource "google_secret_manager_secret_iam_member" "assistant_llm_api_key" {
  count     = local.assistant_has_api_key ? 1 : 0
  secret_id = google_secret_manager_secret.assistant_llm_api_key[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "assistant_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
}

# Deny the global Vertex AI endpoint (aiplatform.googleapis.com) in this
# project, so no request can be processed outside the EU by mistake. Regional
# hosts (europe-west1-aiplatform.googleapis.com, used by the expert search
# embeddings) and the eu multi-region host stay allowed. Start with dry_run and
# check the logs before enforce.
resource "google_project_service" "orgpolicy" {
  count              = var.vertex_global_endpoint_policy != "" ? 1 : 0
  project            = var.project_id
  service            = "orgpolicy.googleapis.com"
  disable_on_destroy = false
}

resource "google_org_policy_policy" "deny_global_vertex_endpoint" {
  count  = var.vertex_global_endpoint_policy != "" ? 1 : 0
  name   = "projects/${var.project_id}/policies/gcp.restrictEndpointUsage"
  parent = "projects/${var.project_id}"

  dynamic "spec" {
    for_each = var.vertex_global_endpoint_policy == "enforce" ? [1] : []
    content {
      rules {
        values {
          denied_values = ["aiplatform.googleapis.com"]
        }
      }
    }
  }

  dynamic "dry_run_spec" {
    for_each = var.vertex_global_endpoint_policy == "dry_run" ? [1] : []
    content {
      rules {
        values {
          denied_values = ["aiplatform.googleapis.com"]
        }
      }
    }
  }

  depends_on = [google_project_service.orgpolicy]
}

# Knowledge index (issue #2195): .github/workflows/index-knowledge.yml runs as
# the GitHub deploy account (created by infrastructure/bootstrap) after each
# production deployment. It writes the index through Hasura with the admin
# secret and embeds passages with Vertex AI, so it gets read access to that
# one secret and roles/aiplatform.user. Accepted trade-off: a leaked GitHub
# key could read the Hasura admin secret.
locals {
  github_service_account = "serviceAccount:github@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "hasura_graphql_admin_key_github" {
  secret_id = google_secret_manager_secret.hasura_graphql_admin_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = local.github_service_account
}

resource "google_project_iam_member" "knowledge_index_vertex_ai_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = local.github_service_account
}
