###############################################################################
# Create a Google SQL database instance for the EduHub application
#####

resource "google_sql_database_instance" "default" {
  # Changing the major version upgrades the instance in place (expect `~` in
  # the plan, never `+/-`). Cloud SQL takes a backup before and after.
  name             = "default-dbi"
  database_version = "POSTGRES_17"
  #region           = var.region
  depends_on = [google_service_networking_connection.private]
  settings {
    # Pinned: Cloud SQL defaults PostgreSQL 16+ to Enterprise Plus, which
    # does not offer shared-core tiers such as db-f1-micro.
    edition           = "ENTERPRISE"
    tier              = var.dbi_tier
    availability_type = var.dbi_availability
    database_flags {
      name  = "max_connections"
      value = var.dbi_max_connections
    }
    backup_configuration {
      enabled                        = var.enable_db_backup
      start_time                     = "02:00"
      point_in_time_recovery_enabled = var.enable_db_backup
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
