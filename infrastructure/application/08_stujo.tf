# Apply IAM policy (see 'main.tf') which grants any user the privilege to invoke the StuJo frontend service
resource "google_cloud_run_service_iam_policy" "stujo_noauth_invoker" {
  location = google_cloud_run_service.stujo.location
  project  = google_cloud_run_service.stujo.project
  service  = google_cloud_run_service.stujo.name

  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Define the Google Cloud Run service for the StuJo job board frontend
# (frontend-nx/apps/stujo, image built via Dockerfile-stujo). Reachable under
# https://stujo.opencampus.sh (production) and
# https://stujo-staging.opencampus.sh (staging) — see local.stujo_domain — and,
# once the cutover switches in 00_variables.tf are on, under stujo.net through
# the load balancer in 09_stujo_net.tf.
resource "google_cloud_run_service" "stujo" {
  provider = google-beta
  name     = local.stujo_service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/stujo:latest"

        ports {
          name           = "http1"
          container_port = 5001
        }
        env {
          name  = "STUJO_SHA"
          value = var.frontend_sha
        }
        env {
          name  = "GRAPHQL_URI"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        # Server-side (SSR) GraphQL endpoint for the public pages
        env {
          name  = "API_URL"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        # Follows the canonical host: NextAuth builds its callback URLs from
        # this, so it has to name the domain visitors actually log in on.
        env {
          name  = "NEXTAUTH_URL"
          value = "https://${local.stujo_public_host}"
        }
        # "true" makes proxy.ts 301 the interim opencampus.sh hosts to their
        # stujo.net equivalents. Runtime env, not a build arg: flipping it is a
        # new revision, not a rebuild, so it can be turned on the moment the
        # certificate is ACTIVE — and off again just as fast.
        env {
          name  = "STUJO_CANONICAL_REDIRECTS"
          value = local.stujo_net_canonical ? "true" : "false"
        }
        # Portal fallback when the request host has no AppSettings.domain match
        env {
          name  = "APP_NAME"
          value = "stujo"
        }
        env {
          name = "HASURA_ADMIN_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nextauth_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "KEYCLOAK_HASURA_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.keycloak_hasura_client_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        env {
          name  = "STORAGE_BUCKET_URL"
          value = "https://storage.googleapis.com/storage/v1/${var.project_id}"
        }
        env {
          name  = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          value = var.stripe_publishable_key
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
  depends_on = [
    google_secret_manager_secret_version.hasura_graphql_admin_key,
    google_secret_manager_secret_version.nextauth_secret,
    google_secret_manager_secret_version.keycloak_hasura_client_secret,
  ]
}

# Apply the public (no-auth) invoker policy to each white-label portal service.
resource "google_cloud_run_service_iam_policy" "stujo_portal_noauth_invoker" {
  for_each = google_cloud_run_service.stujo_portals

  location    = each.value.location
  project     = each.value.project
  service     = each.value.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}

# Per-portal StuJo Cloud Run services (see local.stujo_portals in
# 00_variables.tf). Each is a copy of the root stujo service above that only
# differs in name (so the load balancer url_mask routes its
# <service>.opencampus.sh host here) and APP_NAME (which selects the portal
# branding in apps/stujo/lib/portal.ts). Interim aliases on opencampus.sh so
# each portal is testable before the stujo.net domains are migrated.
resource "google_cloud_run_service" "stujo_portals" {
  for_each = local.stujo_portals

  provider = google-beta
  name     = each.value.service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/docker-repo/stujo:latest"

        ports {
          name           = "http1"
          container_port = 5001
        }
        env {
          name  = "STUJO_SHA"
          value = var.frontend_sha
        }
        env {
          name  = "GRAPHQL_URI"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        # Server-side (SSR) GraphQL endpoint for the public pages
        env {
          name  = "API_URL"
          value = "https://${local.hasura_service_name}.opencampus.sh/v1/graphql"
        }
        # The portal's canonical host — its stujo.net domain after the
        # cutover, the interim opencampus.sh alias before it.
        env {
          name  = "NEXTAUTH_URL"
          value = "https://${local.stujo_portal_public_hosts[each.key]}"
        }
        env {
          name  = "STUJO_CANONICAL_REDIRECTS"
          value = local.stujo_net_canonical ? "true" : "false"
        }
        # Portal selector: resolvePortal() falls back to APP_NAME when the
        # request host has no AppSettings.domain match.
        env {
          name  = "APP_NAME"
          value = each.key
        }
        env {
          name = "HASURA_ADMIN_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.hasura_graphql_admin_key.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.nextauth_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "KEYCLOAK_HASURA_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.keycloak_hasura_client_secret.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        env {
          name  = "STORAGE_BUCKET_URL"
          value = "https://storage.googleapis.com/storage/v1/${var.project_id}"
        }
        env {
          name  = "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          value = var.stripe_publishable_key
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
  depends_on = [
    google_secret_manager_secret_version.hasura_graphql_admin_key,
    google_secret_manager_secret_version.nextauth_secret,
    google_secret_manager_secret_version.keycloak_hasura_client_secret,
  ]
}
