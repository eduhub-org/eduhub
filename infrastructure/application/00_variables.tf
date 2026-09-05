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

  # Interim white-label StuJo portals. Each portal is served by its own tiny
  # Cloud Run service (same image, scales to zero) so the load balancer
  # url_mask can route <service>.opencampus.sh to it. The service sets
  # APP_NAME, which apps/stujo/lib/portal.ts uses to resolve the portal
  # branding without an AppSettings.domain match. This makes every portal
  # testable under stujo-<portal>.opencampus.sh (production) and
  # stujo-<portal>-staging.opencampus.sh (staging, via
  # service_name_extension) before the real stujo.net domains are migrated.
  #
  # The map key is the portal appName and MUST exist in the AppSettings /
  # JobPortal seed data (see backend/migrations .../insert_stujo_app_settings
  # and .../create_table_public_JobPortal). The root "stujo" portal is served
  # by the google_cloud_run_service.stujo resource, so it is not repeated here.
  stujo_portal_app_names = ["stujo-cau", "stujo-haw-kiel", "stujo-flensburg"]
  stujo_portals = {
    for app_name in local.stujo_portal_app_names : app_name => {
      service_name = "${app_name}${var.service_name_extension}"
      domain       = "${app_name}${var.service_name_extension}.opencampus.sh"
    }
  }

  # --- stujo.net cutover (see 09_stujo_net.tf and docs/STUJO_PROD_CUTOVER.md) --
  #
  # Two independent switches, applied in two steps so the canonical URLs only
  # move once the new domain actually serves HTTPS:
  #
  #   stujo_net_serving   step 1 — stand up the stujo.net load balancer, its
  #                       managed certificate and the Cloudflare records. The
  #                       app keeps answering on *.opencampus.sh exactly as
  #                       before; stujo.net simply starts working too.
  #   stujo_net_canonical step 2 — make stujo.net the canonical domain: the
  #                       interim opencampus.sh hosts 301 to it (proxy.ts),
  #                       NextAuth callbacks, mail links and Stripe return URLs
  #                       switch over. Only flip this once the certificate is
  #                       ACTIVE and the hosts are smoke-tested.
  #
  # Both are off unless the workspace sets them, so staging and every plan
  # before the cutover are unaffected.
  stujo_net_serving   = var.stujo_net_enabled && var.cloudflare_zone_id_stujo != ""
  stujo_net_canonical = local.stujo_net_serving && var.stujo_net_canonical

  # Public host of each portal: its stujo.net domain once canonical, the
  # interim opencampus.sh alias before that. Used for NEXTAUTH_URL, the mail
  # and Stripe return URLs, and edu-hub's outbound job links.
  stujo_public_host = local.stujo_net_canonical ? var.stujo_net_canonical_hosts["stujo"] : local.stujo_domain
  stujo_portal_public_hosts = {
    for app_name, portal in local.stujo_portals : app_name => (
      local.stujo_net_canonical ? lookup(var.stujo_net_canonical_hosts, app_name, portal.domain) : portal.domain
    )
  }

  # Every hostname the stujo.net load balancer must terminate TLS for: the
  # portal hosts plus the legacy locale hosts, which only exist to be 301'd.
  stujo_net_all_hostnames = local.stujo_net_serving ? sort(distinct(concat(
    keys(var.stujo_net_hosts), var.stujo_net_redirect_hostnames
  ))) : []
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
  # 2Gi: the cli-migrations-v3 image runs a temporary engine to apply
  # migrations/metadata that overlaps in memory with the real engine at boot,
  # and the schema cache has grown (many tables + event triggers). At 1024M the
  # startup peak exceeded the limit and the container was OOM-killed before
  # binding port 8080, so Cloud Run's startup probe timed out and rollouts got
  # stuck (prod, 2026-07-21). The running instance also OOM'd at rest. ~$6.6/mo
  # extra per always-on instance.
  #
  # Use binary units ("2Gi", like Keycloak in 04_keycloak.tf). The Cloud Run v1
  # Admin API that google_cloud_run_service talks to rejects "2048M" with
  # HTTP 400 "For 1.0 CPU, memory must be between 128Mi and 4Gi inclusive"
  # (staging apply, 2026-07-24), even though gcloud/the v2 API accepts it.
  #
  # This default is the production value. Staging overrides it to "1Gi" via its
  # Terraform Cloud workspace variable: its dataset is a fraction of prod's, so
  # the boot peak stays well under the limit and it saves ~$6/mo on the
  # always-on instance. Consequence: staging cannot reproduce a prod boot OOM.
  default = "2Gi"
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
  description = "Optional override for the Stripe TaxRate id (19% exclusive) used for StuJo job posting checkouts. Leave empty to have publishJobPosting find-or-create the rate automatically; set it to pin a specific rate (e.g. one verified against the live account). Also created by the createStripeJobPostingPrices action."
  type        = string
  default     = ""
}
variable "stujo_seller_organization_id" {
  description = "Organization.id that appears as seller on StuJo job posting invoices (defaults to the employer's organization when empty)"
  type        = string
  default     = ""
}

######
# stujo.net domain cutover
###
# The real StuJo domain lives in its own Cloudflare zone and is served by its
# own load balancer (09_stujo_net.tf), deliberately NOT by adding SANs to the
# shared opencampus.sh certificate: that certificate is a single multi-SAN
# managed cert, and changing its domain list re-provisions it for Keycloak,
# Hasura, EduHub and the API too. See docs/STUJO_PROD_CUTOVER.md.

variable "stujo_net_enabled" {
  description = "Step 1 of the cutover: create the stujo.net load balancer, certificate and DNS records. The app keeps serving on *.opencampus.sh unchanged."
  type        = bool
  default     = false
}

variable "stujo_net_canonical" {
  description = "Step 2 of the cutover: make stujo.net canonical (301s from the interim opencampus.sh hosts, NextAuth/mail/Stripe URLs). Requires stujo_net_enabled and an ACTIVE certificate."
  type        = bool
  default     = false
}

variable "cloudflare_zone_id_stujo" {
  description = "Cloudflare zone id of the stujo.net zone (a different zone from opencampus.sh). Empty keeps the whole cutover inert."
  type        = string
  default     = ""
}

variable "stujo_net_hosts" {
  description = "stujo.net hostnames that serve the app, mapped to the portal (AppSettings.appName) that owns them. Must stay in sync with the JobPortalDomain seed, which is what resolves the branding at request time."
  type        = map(string)
  default = {
    "stujo.net"           = "stujo"
    "www.stujo.net"       = "stujo"
    "cau.stujo.net"       = "stujo-cau"
    "haw-kiel.stujo.net"  = "stujo-haw-kiel"
    "fh-kiel.stujo.net"   = "stujo-haw-kiel"
    "flensburg.stujo.net" = "stujo-flensburg"
  }
}

variable "stujo_net_canonical_hosts" {
  description = "Canonical public host per portal — the one used for NextAuth callbacks, mail links and Stripe return URLs once stujo_net_canonical is on. A portal may answer under several hosts, but only one of them may be canonical."
  type        = map(string)
  default = {
    "stujo"           = "stujo.net"
    "stujo-cau"       = "cau.stujo.net"
    "stujo-haw-kiel"  = "haw-kiel.stujo.net"
    "stujo-flensburg" = "flensburg.stujo.net"
  }
}

variable "stujo_net_redirect_hostnames" {
  description = "Legacy stujo.net hostnames that only need to terminate TLS so proxy.ts can 301 them (the Rails *.en.stujo.net locale hosts). Google-managed certificates have no wildcards, so every host must be listed explicitly — fill this from the actual records in the stujo.net zone."
  type        = list(string)
  default     = []
}

variable "stujo_net_record_ttl" {
  description = "TTL of the stujo.net A records. Lower it (e.g. 60) before the cutover so a rollback to the old server propagates quickly, then raise it again once the move has settled."
  type        = number
  default     = 300
}
