###############################################################################
# Creation of a file storage system for the EduHub application
#####

# Create a bucket in Google cloud storage service (GCS).
resource "google_storage_bucket" "main" {
  name     = var.project_id
  location = var.region
}

# Create a Google service account to manage the storage bucket.
resource "google_service_account" "storage_bucket" {
  account_id   = "storage-bucket"
  display_name = "Storage Bucket Service Account"
}

# Apply the above created IAM policy to the storage bucket replacing any currently existing
resource "google_storage_bucket_iam_member" "admin" {
  bucket = google_storage_bucket.main.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_bucket.email}"
}
