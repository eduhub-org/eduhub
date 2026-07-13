###############################################################################
# Definition of the used Terraform variables
######
# Local Variables
###
locals {
  keycloak_service_name   = "${var.keycloak_service_name_root}${var.service_name_extension}"
  hasura_service_name     = "${var.hasura_service_name_root}${var.service_name_extension}"
  eduhub_service_name     = "${var.eduhub_service_name_root}${var.service_name_extension}"
  eduhub_api_service_name = "api-${local.eduhub_service_name}"
  # StuJo job board frontend. With the default root this resolves to
  # stujo.opencampus.sh (production, empty extension) and
  # stujo-staging.opencampus.sh (staging); override via var.stujo_domain.
  stujo_service_name = "${var.stujo_service_name_root}${var.service_name_extension}"
  stujo_domain       = var.stujo_domain != "" ? var.stujo_domain : "${local.stujo_service_name}.opencampus.sh"
}

######
# Cloud Variables
###
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
variable "commit_sha" {
  description = "SHA of the current git commit (used as tag for all docker images)"
  type        = string
  default     = ""
}


# network
variable "url_mask" {
  description = "Url mask specifying the group of backend endpoints that will be used for the load balancer"
  type        = string
}
variable "keycloak_service_name_root" {
  description = "Name for the service of the Keycloak application"
  type        = string
}
variable "hasura_service_name_root" {
  description = "Name for the service of the Hasura application"
  type        = string
}
variable "eduhub_service_name_root" {
  description = "Name for the service of the edu frontend application"
  type        = string
}
variable "service_name_extension" {
  description = "Name extension for the services not run in production but in other environments"
  type        = string
  default     = ""
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

variable "enable_db_backup" {
  description = "Enable or disable database backup"
  type        = bool
  default     = true
}

# keycloak
variable "keycloak_sha" {
  description = "SHA of the current keycloak folder"
  type        = string
  default     = ""
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
variable "hasura_sha" {
  description = "SHA of the current hasura folder"
  type        = string
  default     = ""
}
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
variable "frontend_sha" {
  description = "SHA of the current frontend-nx folder"
  type        = string
  default     = ""
}
variable "nextauth_secret" {
  description = "Used to encrypt the NextAuth.js JWT, and to hash email verification tokens. This is the default value for the secret option in NextAuth and Middleware."
  type        = string
}
variable "keycloak_hasura_client_secret" {
  description = "Used to authenticate login requests from the edu client."
  type        = string
}
variable "help_docs_url" {
  description = "Stores the URL to a GitBook or other documentation resources that serve as the FAQ and user help guide for the application. The URL is utilized within the app to include the resourec via an iframe"
  type        = string
}



# Serverless Functions
variable "functions_sha" {
  description = "SHA of the current functions folder"
  type        = string
  default     = ""
}
variable "environment" {
  description = "Should typically be a value of either `production` or `staging` to possibly change the behaviour of as serverless function depending on the environment."
  type        = string
}

variable "matrix_homeserver_url" {
  description = "Base URL of the Matrix homeserver (e.g. https://matrix.example.org)"
  type        = string
}

variable "matrix_server_name" {
  description = "Matrix server name used in room aliases and via hints (e.g. example.org)"
  type        = string
}

variable "matrix_element_client_url" {
  description = "Base URL of the Element web client (e.g. https://element.example.org)"
  type        = string
}

variable "matrix_main_space_id" {
  description = "Top-level Matrix community space id (e.g. !abc123:example.org)"
  type        = string
}

variable "matrix_admin_user_id" {
  description = "Matrix admin user id used for administrative room operations (e.g. @admin:example.org)"
  type        = string
}

variable "matrix_admin_access_token" {
  description = "Long-lived Matrix admin access token for room and space management"
  type        = string
  sensitive   = true
}

variable "mailgun_api_key" {
  description = "API key for the Mailgun API"
  type        = string
}
variable "mailgun_domain" {
  description = "Domain for the Mailgun API"
  type        = string
}

# API Access
variable "zoom_account_id" {
  description = "Account ID of the registered access the Zoom API"
  type        = string
}
variable "zoom_api_key" {
  description = "Client ID of the registered access the Zoom API"
  type        = string
}
variable "zoom_api_secret" {
  description = "Secret to the the Zoom API access with the given key identifier"
  type        = string
}
variable "zoom_attendance_pre_buffer_min" {
  description = "Minutes before Session.startDateTime to still accept a Zoom instance for attendance aggregation."
  type        = number
  default     = 30
}
variable "zoom_attendance_post_buffer_min" {
  description = "Minutes after Session.endDateTime to still accept a Zoom instance (captures reconnects right after class)."
  type        = number
  default     = 120
}
variable "lms_url" {
  description = "URL to the LimeSurvey instance"
  type        = string
}
variable "lms_user" {
  description = "User that is used to access the API"
  type        = string
}
variable "lms_password" {
  description = "Password for the API user"
  type        = string
}
variable "lms_attendance_survey_id" {
  description = "ID of the survey which is used to collect the attendance data"
  type        = string
}
variable "mm_url" {
  description = "URL of the Opencampus Mattermost Server"
  type        = string
}
variable "mm_token" {
  description = "The Admin Token from the Opencampus Mattermost Server"
  type        = string
}

# Formbricks Integration
variable "formbricks_api_url" {
  description = "Base URL of the Formbricks instance used for trusted origin validation"
  type        = string
  default     = "https://app.formbricks.com"
}

variable "formbricks_api_key" {
  description = "API key for accessing the Formbricks Management API"
  type        = string
  sensitive   = true
}

# Stripe Integration
variable "stripe_secret_key" {
  description = "Stripe secret API key for payment processing"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret for verifying webhook events"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable API key (safe for frontend)"
  type        = string
}

variable "ghost_newsletter_credentials_encryption_key" {
  description = "AES-256 key used to encrypt/decrypt Ghost newsletter API credentials at rest"
  type        = string
  sensitive   = true
}

######
# StuJo Job Board Variables
###
variable "stujo_service_name_root" {
  description = "Name for the Cloud Run service of the StuJo job board frontend (domain becomes <name><extension>.opencampus.sh unless stujo_domain is set)"
  type        = string
  default     = "stujo"
}
variable "stujo_domain" {
  description = "Full domain for the StuJo frontend. Leave empty to fall back to stujo.opencampus.sh (production) / stujo-staging.opencampus.sh (staging via service_name_extension)."
  type        = string
  default     = ""
}
variable "stujo_admin_email" {
  description = "Recipient of the StuJo admin notification mails (new job postings)"
  type        = string
  default     = ""
}
variable "stripe_tax_rate_id" {
  description = "Stripe TaxRate id (19% exclusive) used for StuJo job posting checkouts; created by the createStripeJobPostingPrices action"
  type        = string
  default     = ""
}
variable "stujo_seller_organization_id" {
  description = "Organization.id that appears as seller on StuJo job posting invoices (defaults to the employer's organization when empty)"
  type        = string
  default     = ""
}
