resource "google_cloud_run_service" "frontend_service" {
  provider = google-beta

  name     = "frontend"
  location = var.region

  template {
    spec {
      containers {
        image = "${var.docker_region}-docker.pkg.dev/edu-hub-staging/docker-repo/frontend:latest"
        ports {
          name           = "http1"
          container_port = 5000
        }
        # env {
        #   name = "NEXT_PUBLIC_API_URL"
        #   value = "${google_cloud_run_service.hasura_service.status[0].url}/v1/graphql"
        # }
        env {
          name  = "GRAPHQL_URI"
          value = "${google_cloud_run_service.hasura_service.status[0].url}/v1/graphql"
        }
        # env {
        #   name = "NEXT_PUBLIC_AUTH_URL"
        #   value = "${google_cloud_run_service.keycloak_service.status[0].url}/auth"
        # }
        env {
          name = "HASURA_ADMIN_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.secret_hasura_admin_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        # env {
        #   name = "STORAGE_BUCKET_URL"
        #   value = "${google_cloud_run_service.keycloak_service.status[0].url}/auth"
        # }
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
      "run.googleapis.com/launch-stage" = "BETA"
    }
  }

  lifecycle {
    ignore_changes = [
      metadata[0].annotations,
    ]
  }

  autogenerate_revision_name = true
  depends_on                 = [google_secret_manager_secret_version.secret_hasura_admin_secret_version_data]
}

resource "google_cloud_run_service_iam_policy" "frontend_service_policy_noauth" {
  location = google_cloud_run_service.frontend_service.location
  project  = google_cloud_run_service.frontend_service.project
  service  = google_cloud_run_service.frontend_service.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
