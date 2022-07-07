###############################################################################
# Definition of the cloud providers that will be used with Terraform
#####

terraform {
  cloud {
    organization = "opencampus"
    hostname     = "app.terraform.io" # Optional; defaults to app.terraform.io

    workspaces {
      tags = ["staging"]
    }
  }
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "3.67.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "3.67.0"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "2.17.0"
    }

  }
}
# Specific settings for the above defined cloud providers
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
