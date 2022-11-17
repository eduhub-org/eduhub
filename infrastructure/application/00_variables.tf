###############################################################################
# Definition of the used Terraform variables
#####

/* variable "GOOGLE_CREDENTIALS" {
  description = "JSON key of the service account 'terraform created' created for the given project"
}
 */
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
variable "cloudflare_email" {
  description = "Email for the user to access Cloudflare"
  type        = string
}
variable "cloudflare_api_key" {
  description = "API key for the user to access Cloudflare"
  type        = string
}


# network
variable "url_mask" {
  description = "Url mask specifying the group of backend endpoints that will be used for the load balancer"
  type        = string
}
variable "keycloak_service_name" {
  description = "Name for the service of the Keycloak application"
  type        = string
}
variable "hasura_service_name" {
  description = "Name for the service of the Hasura application"
  type        = string
}
variable "frontend_service_name" {
  description = "Name for the service of the edu frontend application"
  type        = string
}
variable "rent_a_scientist_service_name" {
  description = "Name for the service of the Rent-a-Scientist frontend application"
  type        = string
}
variable "cloudflare_zone_id" {
  description = "The DNS zone ID a record in Cloudflaire will be added to"
  type        = string
}
variable "cloud_function_ingress_settings" {
  description = "Controls what traffic can reach the cloud functions"
  type        = string
  default     = "ALLOW_INTERNAL_ONLY"
}


# databases
variable "dbi_tier" {
  description = "Tier for the database instance"
  type        = string
  default     = "db-f1-micro"
}
variable "dbi_availability" {
  description = "Availablity of the database instance"
  type        = string
  default     = "ZONAL"
}
variable "dbi_create_replica" {
  description = "Create a replica database"
  type        = bool
  default     = "false"
}
variable "dbi_max_connections" {
  # Needs to be higher then the standard setting to allow the startup of hasura
  description = "Define allowed maximum number of connections"
  type        = number
  default     = 250
}
variable "keycloak_db_user" {
  description = "Name for the user of the Keycloak database"
  type        = string
  default     = "admin"
}
variable "keycloak_db_pw" {
  description = "Password for the user of the Keycloak database"
  type        = string
}
variable "hasura_db_user" {
  description = "Name for the user of the Hasura database"
  type        = string
  default     = "admin"
}
variable "hasura_db_pw" {
  description = "Password for the user of the Hasura database"
  type        = string
}

# keycloak
variable "commit_sha" {
  description = "SHA of the current git commit (used as tag for all docker images)"
  type        = string
}
variable "keycloak_user" {
  description = "User for the Keycloak console"
  type        = string
}
variable "keycloak_pw" {
  description = "Password for the Keycloak console"
  type        = string
}


# hasura
variable "hasura_graphql_admin_key" {
  description = "Admin key for the Hasura GraphQL API"
  type        = string
}
variable "hasura_cloud_function_secret" {
  description = "Hasura secret for cloud functions"
  type        = string
}
variable "hasura_mail_pw" {
  description = "Hasura secret for cloud functions"
  type        = string
}
variable "hasura_mail_user" {
  description = "Hasura secret for cloud functions"
  type        = string
}
variable "hasura_graphql_enable_console" {
  description = "Boolean to enable the Hasura console"
  type        = string
  default     = "false"
}
variable "hasura_graphql_dev_mode" {
  description = "Boolean to enable the GraphQL developer mode for Hasura"
  type        = string
  default     = "false"
}
variable "hasura_memory_limit" {
  description = "Memory limit for Hasura cloud run service"
  type        = string
  default     = "1024M"
}

# Frontend
# Rent-A-Scientist
variable "nextauth_secret" {
  description = "Used to encrypt the NextAuth.js JWT, and to hash email verification tokens. This is the default value for the secret option in NextAuth and Middleware."
  type        = string
}
