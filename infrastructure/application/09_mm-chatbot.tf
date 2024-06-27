# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the EduHub frontend service
resource "google_cloud_run_service_iam_policy" "eduhub_noauth_invoker" {
  location = google_cloud_run_service.eduhub.location
  project  = google_cloud_run_service.eduhub.project
  service  = google_cloud_run_service.eduhub.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Create a variable for the Mattermost Token
resource "google_secret_manager_secret" "mm_bot_token" {
  provider  = google-beta
  secret_id = "mm-bot-token"
  replication {
    auto {}
  }
}

# Create a variable for the OpenAI Token
resource "google_secret_manager_secret" "openai_token" {
  provider  = google-beta
  secret_id = "openai-token"
  replication {
    auto {}
  }
}

# Set the password of the Mattermost Token
resource "google_secret_manager_secret_version" "mm_bot_token" {
  provider    = google-beta
  secret      = google_secret_manager_secret.mm_bot_token.name
  secret_data = var.mm_bot_token
}

# Set the password of the OpenAI Token
resource "google_secret_manager_secret_version" "openai_token" {
  provider    = google-beta
  secret      = google_secret_manager_secret.openai_token.name
  secret_data = var.openai_token
}

# Grant the compute engine service account permissions to access the secrect for the Mattermost Token
resource "google_secret_manager_secret_iam_member" "mm_bot_token" {
  secret_id  = google_secret_manager_secret.mm_bot_token.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.mm_bot_token]
}

# Grant the compute engine service account permissions to access the secrect for the OpenAI Token
resource "google_secret_manager_secret_iam_member" "openai_token" {
  secret_id  = google_secret_manager_secret.openai_token.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.openai_token]
}


# Define the Google Cloud Run service for the Mattermost Chatbot
resource "google_cloud_run_service" "mm_chatbot" {
  provider = google-beta
  name     = local.mm_chatbot_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "ghcr.io/yguy/chatgpt-mattermost-bot:latest"

        ports {
          name           = "http1"
          container_port = 3000
        }
        env {
          name  = "MATTERMOST_URL"
          value = var.mm_url
        }
        # rename to API_URL
        env {
          name  = "MATTERMOST_BOTNAME"
          value = var.mm_bot_name
        }
        env {
          name  = "BOT_INSTRUCTION"
          value = var.mm_bot_instruction
        }        
        env {
          name = "MATTERMOST_TOKEN"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.mm_bot_token.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "OPENAI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.openai_token.secret_id
              key  = "latest"
            }
          }
        }   
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "1"
      }
    }
  }

  metadata {
    annotations = {
      "run.googleapis.com/launch-stage"     = "BETA"
      "run.googleapis.com/startupProbeType" = null
    }
  }

  lifecycle {
    ignore_changes = [
      metadata[0].annotations,
    ]
  }

  autogenerate_revision_name = true
}
