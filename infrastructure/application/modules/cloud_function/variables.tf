variable "project_id" {
  description = "Project the function, its service account and its IAM live in."
  type        = string
}

variable "region" {
  description = "Region of the function."
  type        = string
}

variable "name" {
  description = "Name of the Cloud Function (and of its Cloud Run service)."
  type        = string
}

variable "description" {
  description = "Description of the Cloud Function."
  type        = string
}

variable "runtime" {
  description = "Cloud Functions runtime, e.g. nodejs22 or python311."
  type        = string
}

variable "entry_point" {
  description = "Exported function the runtime calls."
  type        = string
}

variable "source_bucket" {
  description = "Bucket that holds the zipped source."
  type        = string
}

variable "source_object" {
  description = "Object name of the zipped source, e.g. cloud-functions/callNodeFunction.zip. Several units can deploy the same zip with different entry points."
  type        = string
}

variable "available_memory" {
  description = "Memory per instance, e.g. 256M."
  type        = string
}

variable "available_cpu" {
  description = "CPUs per instance; null leaves the platform default for the memory size."
  type        = string
  default     = null
}

variable "timeout_seconds" {
  description = "Request timeout. Keep it at or above the longest Hasura action or trigger timeout of the unit's handlers."
  type        = number
}

variable "min_instance_count" {
  description = "Minimum number of instances; null for none."
  type        = number
  default     = null
}

variable "max_instance_count" {
  description = "Maximum number of instances."
  type        = number
}

variable "ingress_settings" {
  description = "Ingress setting of the function (ALLOW_ALL, ALLOW_INTERNAL_ONLY, ...)."
  type        = string
}

variable "environment_variables" {
  description = "Plain runtime environment variables."
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = <<-EOT
    Secret Manager secrets exposed as environment variables, in this order
    (the provider stores them as a list, so reordering redeploys the
    function). `secret_id` is the secret's short id, `id` its resource id
    (projects/<project>/secrets/<secret_id>), used for the IAM grant.
  EOT
  type = list(object({
    key       = string
    secret_id = string
    id        = string
  }))
  default = []
}

variable "service_account_email" {
  description = "Run as this existing service account. The caller manages its IAM, including secret access. Mutually exclusive with service_account_id."
  type        = string
  default     = null
}

variable "service_account_id" {
  description = "Create a dedicated service account with this account_id and grant it secretAccessor on exactly the secrets in secret_environment_variables. Mutually exclusive with service_account_email."
  type        = string
  default     = null

  validation {
    condition     = var.service_account_id == null || can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.service_account_id))
    error_message = "service_account_id must be 6-30 characters: lowercase letters, digits and hyphens, starting with a letter."
  }
}

variable "public_invoker" {
  description = <<-EOT
    How allUsers gets roles/run.invoker on the function's Cloud Run service:
    "policy" (authoritative google_cloud_run_service_iam_policy) or "binding"
    (google_cloud_run_service_iam_binding). Either way the function is
    publicly invokable and checks the Hasura secret itself; the choice only
    exists so apiProxy keeps the resource type it was created with.
  EOT
  type        = string
  default     = "policy"

  validation {
    condition     = contains(["policy", "binding"], var.public_invoker)
    error_message = "public_invoker must be \"policy\" or \"binding\"."
  }
}
