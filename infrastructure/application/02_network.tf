###############################################################################
# Definition of network resources
#####

# Create a virtual private cloud (VPC) network on the Google Cloud Platform (GCP).
resource "google_compute_network" "private" {
  provider = google-beta
  name     = "private-network"
}

# Create a Global Address resource. Global addresses are used for HTTP(S) load balancing.
resource "google_compute_global_address" "private" {
  provider      = google-beta
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.private.id
}

# Create a private VPC connection with a GCP service provider
resource "google_service_networking_connection" "private" {
  provider                = google-beta
  network                 = google_compute_network.private.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private.name]
}

# Create a serverless VPC Access connector
resource "google_vpc_access_connector" "default" {
  provider      = google-beta
  name          = "vpc-lan-con"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.private.name
  min_instances = 2
  max_instances = 3
  machine_type  = "f1-micro"
}


###############################################################################
# Creation of the Load Balancer
#####

# Create a network endpoint group (NEG) for the load balancer defined below
resource "google_compute_region_network_endpoint_group" "default" {
  provider              = google-beta
  name                  = "serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    #service  = module.keycloak_service.service_name
    url_mask = var.url_mask
  }

  lifecycle {
    create_before_destroy = true
  }
  depends_on = [
    google_compute_region_network_endpoint_group.default
  ]

}

# create Cloud HTTP(S) Load Balancer with Serverless Network Endpoint Groups (NEGs)
# and place serverless services from Cloud Run, Cloud Functions and App Engine behind a Cloud Load Balancer
module "lb-http" {
  source  = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version = "~> 12.0.0"
  name    = "load-balancer"
  project = var.project_id

  # Create Google-managed SSL certificates for the specified domains.
  #
  # This is a single multi-SAN managed cert. A managed cert's domain list is
  # immutable, so changing it (e.g. adding the stujo portal hosts below)
  # provisions a brand-new cert; random_certificate_suffix + the module's
  # create-before-destroy make the swap gap-free. The new cert only reaches
  # ACTIVE once EVERY listed domain validates, and validation requires each
  # domain's Cloudflare A record (created further down from this LB's IP) to
  # resolve to the LB. Those records depend on module.lb-http.external_ip, so
  # they can only be created after this module — the cert cannot be ordered
  # to wait for them. This is self-healing (GCP retries validation; Cloudflare
  # propagates in seconds), but the practical consequence when applying a
  # domain change is a provisioning window (can be tens of minutes) during
  # which the affected hosts serve no valid HTTPS. Apply domain changes in a
  # low-traffic window and confirm the new cert is ACTIVE and the new records
  # resolve before treating the new hosts as live.
  #
  # TEMPORARY (2026-07-21 incident): local.stujo_domain is excluded from the
  # cert. stujo.opencampus.sh currently resolves to a manually configured
  # Cloudflare proxied setup (302 redirect to stujo.net) that Terraform does
  # not manage, so its validation fails and blocks the ENTIRE cert — taking
  # down HTTPS for all hosts on the load balancer. Re-add local.stujo_domain
  # once the manual Cloudflare record/redirect rule is removed and
  # stujo.opencampus.sh resolves to this LB's IP again.
  ssl                             = "true"
  managed_ssl_certificate_domains = concat(["${local.keycloak_service_name}.opencampus.sh", "${local.hasura_service_name}.opencampus.sh", "${local.eduhub_service_name}.opencampus.sh", "${local.eduhub_api_service_name}.opencampus.sh"], [for portal in local.stujo_portals : portal.domain])
  https_redirect                  = "true"
  random_certificate_suffix       = "true"

  backends = {
    default = {
      description = null
      groups = [
        {
          group = google_compute_region_network_endpoint_group.default.id
        }
      ]
      enable_cdn              = false
      security_policy         = null
      custom_request_headers  = null
      custom_response_headers = null

      iap_config = {
        enable               = false
        oauth2_client_id     = ""
        oauth2_client_secret = ""
      }
      log_config = {
        enable      = false
        sample_rate = null
      }
    }
  }
  depends_on = [
    google_compute_region_network_endpoint_group.default
  ]
}


###############################################################################
# Setting the Domains for the Applications using Cloudflaire as a Provider
#####
#
# IMPORTANT: every host below is part of the load balancer's Google-managed
# multi-SAN certificate (see managed_ssl_certificate_domains above). Managed
# cert validation requires each host to resolve directly to the LB IP, so all
# records MUST stay DNS-only (proxied = false). If any single record is
# switched to Cloudflare proxied mode, validation for that domain fails and
# the ENTIRE certificate cannot (re)provision — taking down HTTPS for ALL
# domains on the LB. proxied is pinned explicitly so Terraform reverts any
# manual change in the Cloudflare dashboard.

# Add a domain record for the Keycloak service
resource "cloudflare_record" "keycloak" {
  zone_id = var.cloudflare_zone_id
  name    = local.keycloak_service_name
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}

# Add a domain record for the Hasura service
resource "cloudflare_record" "hasura" {
  zone_id = var.cloudflare_zone_id
  name    = local.hasura_service_name
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}

# Add a domain record for the Hasura service
resource "cloudflare_record" "eduhub" {
  zone_id = var.cloudflare_zone_id
  name    = local.eduhub_service_name
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}

# Add a domain record for the EduHub API service
resource "cloudflare_record" "eduhub_api" {
  zone_id = var.cloudflare_zone_id
  name    = local.eduhub_api_service_name
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}

# Add a domain record for the StuJo job board frontend
resource "cloudflare_record" "stujo" {
  zone_id = var.cloudflare_zone_id
  name    = trimsuffix(local.stujo_domain, ".opencampus.sh")
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}

# Add domain records for the interim white-label StuJo portal hosts on
# opencampus.sh (stujo-<portal>[-staging].opencampus.sh). Each maps to its
# own Cloud Run service via the load balancer url_mask (see
# local.stujo_portals in 00_variables.tf and 08_stujo.tf).
resource "cloudflare_record" "stujo_portals" {
  for_each = local.stujo_portals

  zone_id = var.cloudflare_zone_id
  name    = trimsuffix(each.value.domain, ".opencampus.sh")
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = false
}
