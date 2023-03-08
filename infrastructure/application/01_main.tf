###############################################################################
# Basic information on the used cloud provider
#####

# Definition of the Terraform Cloud project
terraform {
  required_version = "~> 1.3"

  cloud {
    organization = "opencampus"
    hostname     = "app.terraform.io" # Optional; defaults to app.terraform.io

    # "workspaces" must be defined via an environment variable named "TF_WORKSPACE"
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.31.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "4.31.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 3.0"
    }

  }
}

# Define basic Google and Google Beta project settings
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}
provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}
# Define basic settings to access Clouflaire
provider "cloudflare" {
  email   = var.cloudflare_email
  api_key = var.cloudflare_api_key
}

#####

# Retrieve data object for the above defined provider project
data "google_project" "eduhub" {
}

# Retrieve the Google IAM policy that allows anyone on the Internet to invoke/run the 
# cloud run module this IAM policy is applied to
data "google_iam_policy" "noauth_invoker" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}
