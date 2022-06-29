###############################################################################
# Definition of the used Terraform variables
#####

variable "GOOGLE_CREDENTIALS" {
  description = "JSON key of the service account 'terraform_eduhub created' created for the given project"
}

# main
variable "project_id" {
  description = "The id of the Google Cloud project that is created"
  type        = string
}
variable "region" {
  description = "The region for resources associated with the Google Cloud project"
  type        = string
}
variable "zone" {
  description = "The zone for resources associated with the Google Cloud project"
  type        = string
}

# network
variable "url_mask" {
  description = "Url mask specifying the group of backend endpoints that will be used for the load balancer"
  type        = string
}
variable "keycloak_domain" {
  description = "Domain for the Keycloak application"
  type        = string
}

/*
# databases
variable "dbi_tier" {
  description = "Domain for the Keycloak application"
  type        = string
  default     = "db-f1-micro"
}
variable "dbi_availability" {
  description = "Availablity of the database instance"
  type        = string
  default     = "REGIONAL"
}
variable "keycloak_db_user" {}
variable "keycloak_db_pw" {}
variable "hasura_db_user" {}
variable "hasura_db_pw" {}

# storage
variable "storage_bucket_name" {}

# keycloak
variable "keycloak_user" {}
variable "keycloak_pw" {}
variable "keycloak_domain" {}
variable "docker_image_keycloak" {}

# hasura
variable "hasura_graphql_admin" {}
variable "hasura_domain" {}
variable "docker_image_hasura" {}
variable "hasura_cloud_function_link" {}
variable "hasura_graphql_enable_console" {
  default = "false"
}
variable "hasura_graphql_dev_mode" {
  default = "false"
}

variable "frontend_service_domain" {}
 */
