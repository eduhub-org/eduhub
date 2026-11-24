###############################################################################
# Assistant (ADR 0005): Gemini on Vertex AI, processed in the EU
#####
# The Assistant's backend runs in the edu service (a Next.js API route) and
# calls Vertex AI's OpenAI-compatible Chat Completions API. The edu service
# runs as the default compute service account, so that account gets
# roles/aiplatform.user. The aiplatform API is enabled in 06_cloud-functions.tf.
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
  assistant_llm_base_url = "https://${local.assistant_llm_host}/v1/projects/${var.project_id}/locations/${var.assistant_llm_location}/endpoints/openapi"
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
# the GitHub deploy account (created in infrastructure/foundation) after each
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
