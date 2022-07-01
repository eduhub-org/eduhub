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
  provider       = google-beta
  name           = "vpc-lan-con"
  ip_cidr_range  = "10.8.0.0/28"
  network        = google_compute_network.private.name
  min_instances  = 2
  max_instances  = 3
  max_throughput = 300
  machine_type   = "f1-micro"
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
}

# create Cloud HTTP(S) Load Balancer with Serverless Network Endpoint Groups (NEGs)
# and place serverless services from Cloud Run, Cloud Functions and App Engine behind a Cloud Load Balancer
module "lb-http" {
  source  = "GoogleCloudPlatform/lb-http/google//modules/serverless_negs"
  version = "~> 6.2.0"
  name    = "load-balancer"
  project = var.project_id

  # Create Google-managed SSL certificates for the specified domains. 
  ssl                             = "true"
  managed_ssl_certificate_domains = ["${var.keycloak_service_name}.opencampus.sh", "${var.hasura_service_name}.opencampus.sh"]
  use_ssl_certificates            = "false"
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
}


###############################################################################
# Setting the Domains for the Applications using Cloudflaire as a Provider
#####

# Add a domain record for the Keycloak service
resource "cloudflare_record" "keycloak" {
  zone_id = var.cloudflare_zone_id
  name    = var.keycloak_service_name
  type    = "A"
  value   = module.lb-http.external_ip
}

# Add a domain record for the Hasura service
resource "cloudflare_record" "hasura" {
  zone_id = var.cloudflare_zone_id
  name    = var.hasura_service_name
  type    = "A"
  value   = module.lb-http.external_ip
}
