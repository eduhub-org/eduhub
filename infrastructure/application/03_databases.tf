###############################################################################
# Create a Google SQL database instance for the EduHub application
#####

resource "google_sql_database_instance" "default" {
  name             = "default-dbi"
  database_version = "POSTGRES_13"
  #region           = var.region
  depends_on = [google_service_networking_connection.private]
  settings {
    tier              = var.dbi_tier
    availability_type = var.dbi_availability
    database_flags {
      name  = "max_connections"
      value = var.dbi_max_connections
    }
    backup_configuration {
      enabled                        = true
      binary_log_enabled             = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 30
      }
    }
    ip_configuration {
      # ipv4_enabled = "false"
      private_network = google_compute_network.private.id
    }
  }
}


###############################################################################
# Create the Keycloak database in the EduHub SQL instance and the user to access it
#####

# Create an SQL database for Keycloak inside the created SQL instance
resource "google_sql_database" "keycloak" {
  name     = "keycloak"
  instance = google_sql_database_instance.default.name
}
# Create an SQL User on the above created Keycloak database.
resource "google_sql_user" "keycloak" {
  name     = var.keycloak_db_user
  instance = google_sql_database_instance.default.name
  password = var.keycloak_db_pw
}
# Create a variable for the password of the Keycloak database user in the Google secret manager 
resource "google_secret_manager_secret" "keycloak_db_pw" {
  provider  = google-beta
  secret_id = "keycloak-db-pw"
  replication {
    automatic = true
  }
}
# Set a value for the password of the Keycloak database user in the above created variable
resource "google_secret_manager_secret_version" "keycloak_db_pw" {
  provider    = google-beta
  secret      = google_secret_manager_secret.keycloak_db_pw.name
  secret_data = var.keycloak_db_pw
}
# Grant the defined service account member permission to access the secret with the password for the Keycloak database
resource "google_secret_manager_secret_iam_member" "keycloak_db_pw" {
  secret_id  = google_secret_manager_secret.keycloak_db_pw.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${data.google_project.eduhub.number}-compute@developer.gserviceaccount.com"
  depends_on = [google_secret_manager_secret.keycloak_db_pw]
}


###############################################################################
# Create the Hasura database in the EduHub SQL instance and the user to access it
#####

# Create an SQL database for Hasura inside the created SQL instance
resource "google_sql_database" "hasura" {
  name     = "hasura"
  instance = google_sql_database_instance.default.name
}
# Create an SQL User on the above created Hasura database.
resource "google_sql_user" "hasura" {
  name     = var.hasura_db_user
  instance = google_sql_database_instance.default.name
  password = var.hasura_db_pw
}
# Create a secret for the URL of the Hasura database in the Google secret manager 
resource "google_secret_manager_secret" "hasura_db_url" {
  provider  = google-beta
  secret_id = "hasura-db-url"
  replication {
    automatic = true
  }
}
# Create a new version of the secret for the URL to the Hasura database based on the user and password created for the Hasura database
resource "google_secret_manager_secret_version" "hasura_db_url" {
  provider    = google-beta
  secret      = google_secret_manager_secret.hasura_db_url.name
  secret_data = "postgres://${var.hasura_db_user}:${var.hasura_db_pw}@${google_sql_database_instance.default.private_ip_address}:5432/${google_sql_database.hasura.name}"
}
