###############################################################################
# stujo.net — the real public StuJo domain
#####
#
# Everything in this file is inert until the workspace sets
# var.stujo_net_enabled (+ var.cloudflare_zone_id_stujo); see the switches in
# 00_variables.tf and the runbook in docs/STUJO_PROD_CUTOVER.md.
#
# Why a SEPARATE load balancer instead of adding stujo.net to the existing one
# (02_network.tf):
#
#   1. Certificate blast radius. The shared load balancer uses ONE multi-SAN
#      Google-managed certificate whose domain list is immutable — adding SANs
#      re-provisions it, and the replacement only goes ACTIVE once EVERY domain
#      on it validates. A slow or failed stujo.net validation would therefore
#      put Keycloak, Hasura, EduHub and the API at risk. A dedicated
#      certificate can only ever fail for stujo.net.
#   2. Routing. The shared load balancer derives the Cloud Run service from the
#      hostname via url_mask ("<service>.opencampus.sh"), which cannot express
#      "cau.stujo.net → service stujo-cau". Host rules can, but the lb-http
#      module owns the URL map: passing our own back into it (create_url_map =
#      false) would reference the module's own backend service and create a
#      dependency cycle. Owning a second, small load balancer end-to-end avoids
#      touching the routing that Keycloak, Hasura and EduHub run on.
#
# The cost is one extra global forwarding rule (~$18/month) and a second IP.
# Rollback is a DNS change: point the records back at the Rails server.

locals {
  # Portal appName → the Cloud Run service that serves it. The root portal is
  # google_cloud_run_service.stujo, the others are the per-portal copies in
  # 08_stujo.tf (they differ only in APP_NAME and NEXTAUTH_URL).
  stujo_net_services = {
    for app_name in distinct(values(var.stujo_net_hosts)) :
    app_name => (
      app_name == "stujo" ? local.stujo_service_name : (
        contains(keys(local.stujo_portals), app_name) ? local.stujo_portals[app_name].service_name : ""
      )
    )
    if local.stujo_net_serving
  }

  # Portal appName → the hostnames routed to it. The redirect-only legacy hosts
  # ride along on the root service: proxy.ts 301s them before anything renders,
  # so which service answers is irrelevant — they only need to terminate TLS.
  stujo_net_hosts_by_app = {
    for app_name in distinct(values(var.stujo_net_hosts)) :
    app_name => sort(distinct(concat(
      [for host, owner in var.stujo_net_hosts : host if owner == app_name],
      app_name == "stujo" ? var.stujo_net_redirect_hostnames : [],
    )))
    if local.stujo_net_serving
  }
}

# Dedicated public IP. Kept separate from the shared load balancer's address so
# the stujo.net records can be pointed elsewhere (or withdrawn) on their own.
resource "google_compute_global_address" "stujo_net" {
  count   = local.stujo_net_serving ? 1 : 0
  name    = "stujo-net-ip"
  project = var.project_id
}

# One Google-managed certificate for all stujo.net hostnames. Managed
# certificates have no wildcard support, so every host is listed explicitly;
# validation requires each of them to already resolve to the IP above, which is
# why the DNS records and the certificate are created in the same apply and the
# certificate needs a few minutes (occasionally tens of minutes) to go ACTIVE.
resource "random_id" "stujo_net_certificate" {
  count       = local.stujo_net_serving ? 1 : 0
  byte_length = 4
  # A managed certificate's domain list is immutable: changing the hostnames
  # has to create a new certificate, so the name has to change with them.
  keepers = {
    domains = join(",", local.stujo_net_all_hostnames)
  }
}

resource "google_compute_managed_ssl_certificate" "stujo_net" {
  count   = local.stujo_net_serving ? 1 : 0
  name    = "stujo-net-cert-${random_id.stujo_net_certificate[0].hex}"
  project = var.project_id

  managed {
    domains = local.stujo_net_all_hostnames
  }

  lifecycle {
    create_before_destroy = true
  }
}

# One serverless NEG + backend service per portal service, so a host rule can
# name the service that must answer. A serverless NEG pinned to a service needs
# no url_mask and no health check.
resource "google_compute_region_network_endpoint_group" "stujo_net" {
  for_each = local.stujo_net_services

  provider              = google-beta
  name                  = "stujo-net-neg-${each.key}"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = each.value
  }

  lifecycle {
    create_before_destroy = true

    precondition {
      condition     = each.value != ""
      error_message = "stujo_net_hosts maps a host to the unknown portal '${each.key}'. Use \"stujo\" or one of local.stujo_portal_app_names."
    }
  }
}

resource "google_compute_backend_service" "stujo_net" {
  for_each = local.stujo_net_services

  name                  = "stujo-net-backend-${each.key}"
  project               = var.project_id
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.stujo_net[each.key].id
  }
}

# Host → portal routing. Everything unknown (a host added to the certificate
# but not to the map, a stray Host header) falls back to the root portal.
resource "google_compute_url_map" "stujo_net" {
  count           = local.stujo_net_serving ? 1 : 0
  name            = "stujo-net-lb"
  project         = var.project_id
  default_service = google_compute_backend_service.stujo_net["stujo"].id

  dynamic "host_rule" {
    for_each = local.stujo_net_hosts_by_app
    content {
      hosts        = host_rule.value
      path_matcher = host_rule.key
    }
  }

  dynamic "path_matcher" {
    for_each = local.stujo_net_hosts_by_app
    content {
      name            = path_matcher.key
      default_service = google_compute_backend_service.stujo_net[path_matcher.key].id
    }
  }

  lifecycle {
    precondition {
      condition     = contains(keys(local.stujo_net_services), "stujo")
      error_message = "stujo_net_hosts must map at least one hostname to the root portal \"stujo\" — it is the load balancer's default backend."
    }
  }
}

resource "google_compute_target_https_proxy" "stujo_net" {
  count            = local.stujo_net_serving ? 1 : 0
  name             = "stujo-net-https-proxy"
  project          = var.project_id
  url_map          = google_compute_url_map.stujo_net[0].id
  ssl_certificates = [google_compute_managed_ssl_certificate.stujo_net[0].id]
}

resource "google_compute_global_forwarding_rule" "stujo_net_https" {
  count                 = local.stujo_net_serving ? 1 : 0
  name                  = "stujo-net-https"
  project               = var.project_id
  target                = google_compute_target_https_proxy.stujo_net[0].id
  ip_address            = google_compute_global_address.stujo_net[0].address
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Plain HTTP only ever 301s to HTTPS, mirroring https_redirect on the shared
# load balancer. It must stay reachable: the legacy inbound links this whole
# cutover exists for are largely http://.
resource "google_compute_url_map" "stujo_net_http_redirect" {
  count   = local.stujo_net_serving ? 1 : 0
  name    = "stujo-net-http-redirect"
  project = var.project_id

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "stujo_net" {
  count   = local.stujo_net_serving ? 1 : 0
  name    = "stujo-net-http-proxy"
  project = var.project_id
  url_map = google_compute_url_map.stujo_net_http_redirect[0].id
}

resource "google_compute_global_forwarding_rule" "stujo_net_http" {
  count                 = local.stujo_net_serving ? 1 : 0
  name                  = "stujo-net-http"
  project               = var.project_id
  target                = google_compute_target_http_proxy.stujo_net[0].id
  ip_address            = google_compute_global_address.stujo_net[0].address
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# DNS in the stujo.net zone. As with the opencampus.sh records, these MUST stay
# DNS-only (proxied = false): a proxied record answers with Cloudflare's IP, the
# managed certificate can then never validate that host, and the certificate is
# all-or-nothing. proxied is pinned so Terraform reverts a manual change in the
# Cloudflare dashboard.
#
# Terraform does not adopt the zone's existing records: the old A records
# pointing at the Rails server have to be deleted (or imported) at cutover,
# otherwise Cloudflare answers with both addresses in turn and half the traffic
# still lands on the old site.
resource "cloudflare_record" "stujo_net" {
  for_each = toset(local.stujo_net_all_hostnames)

  zone_id = var.cloudflare_zone_id_stujo
  name    = each.value == "stujo.net" ? "@" : trimsuffix(each.value, ".stujo.net")
  type    = "A"
  value   = google_compute_global_address.stujo_net[0].address
  proxied = false
  ttl     = var.stujo_net_record_ttl
}

output "stujo_net_lb_ip" {
  description = "Public IP of the stujo.net load balancer (empty while the cutover is off)."
  value       = try(google_compute_global_address.stujo_net[0].address, "")
}
