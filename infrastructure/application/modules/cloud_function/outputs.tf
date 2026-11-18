output "uri" {
  description = "HTTPS URL of the function (what Hasura calls)."
  value       = google_cloudfunctions2_function.this.service_config[0].uri
}

output "name" {
  description = "Name of the function and of its Cloud Run service."
  value       = google_cloudfunctions2_function.this.name
}

output "service_account_email" {
  description = "Runtime service account, or null for the default compute account."
  value       = local.service_account_email
}

output "service_account_name" {
  description = "Resource name of the dedicated service account (projects/.../serviceAccounts/...), or null when none was created."
  value       = one(google_service_account.this[*].name)
}
