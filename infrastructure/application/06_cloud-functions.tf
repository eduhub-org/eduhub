###############################################################################
# Create Google Cloud Function Services
#####


###############################################################################
# Create Google cloud function for loadAchievementCertificate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_achievement_certificate_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_achievement_certificate.location
  project     = google_cloudfunctions2_function.load_achievement_certificate.project
  service     = google_cloudfunctions2_function.load_achievement_certificate.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_achievement_certificate" {
  name   = "cloud-functions/loadAchievementCertificate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_achievement_certificate" {
  provider    = google-beta
  location    = var.region
  name        = "load-achievement-certificate"
  description = "Loads an achievement certificate from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadAchievementCertificate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_achievement_certificate.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadAchievementCertificateTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_achievement_certificate_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_achievement_certificate_template.location
  project     = google_cloudfunctions2_function.load_achievement_certificate_template.project
  service     = google_cloudfunctions2_function.load_achievement_certificate_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_achievement_certificate_template" {
  name   = "cloud-functions/loadAchievementCertificateTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_achievement_certificate_template" {
  provider    = google-beta
  location    = var.region
  name        = "load-achievement-certificate-template"
  description = "Loads an achivement certificate template (each program has its own) from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadAchievementCertificateTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_achievement_certificate_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadAchievementRecordDocumentation
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_achievement_record_documentation_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_achievement_record_documentation.location
  project     = google_cloudfunctions2_function.load_achievement_record_documentation.project
  service     = google_cloudfunctions2_function.load_achievement_record_documentation.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_achievement_record_documentation" {
  name   = "cloud-functions/loadAchievementRecordDocumentation.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_achievement_record_documentation" {
  provider    = google-beta
  location    = var.region
  name        = "load-achievement-record-documentation"
  description = "Loads an achivement record documentation file from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadAchievementRecordDocumentation"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_achievement_record_documentation.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadParticipationCertificate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_participation_certificate_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_participation_certificate.location
  project     = google_cloudfunctions2_function.load_participation_certificate.project
  service     = google_cloudfunctions2_function.load_participation_certificate.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_participation_certificate" {
  name   = "cloud-functions/loadParticipationCertificate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_participation_certificate" {
  provider    = google-beta
  location    = var.region
  name        = "load-participation-certificate"
  description = "Loads a participation certificate from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadParticipationCertificate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_participation_certificate.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadParticipationCertificateTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_participation_certificate_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_participation_certificate_template.location
  project     = google_cloudfunctions2_function.load_participation_certificate_template.project
  service     = google_cloudfunctions2_function.load_participation_certificate_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_participation_certificate_template" {
  name   = "cloud-functions/loadParticipationCertificateTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_participation_certificate_template" {
  provider    = google-beta
  location    = var.region
  name        = "load-participation-certificate-template"
  description = "Loads a participation certificate template (each program has its own) from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadParticipationCertificateTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_participation_certificate_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveAchievementCertificate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_certificate_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_certificate.location
  project     = google_cloudfunctions2_function.save_achievement_certificate.project
  service     = google_cloudfunctions2_function.save_achievement_certificate.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_certificate" {
  name   = "cloud-functions/saveAchievementCertificate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_certificate" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-certificate"
  description = "Save an created achievement certificate to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementCertificate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_certificate.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveAchievementCertificateTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_certificate_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_certificate_template.location
  project     = google_cloudfunctions2_function.save_achievement_certificate_template.project
  service     = google_cloudfunctions2_function.save_achievement_certificate_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_certificate_template" {
  name   = "cloud-functions/saveAchievementCertificateTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_certificate_template" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-certificate-template"
  description = "Save an achievement certificate template (each program has its own) to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementCertificateTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_certificate_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveAchievementRecordCoverImage
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_record_cover_image_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_record_cover_image.location
  project     = google_cloudfunctions2_function.save_achievement_record_cover_image.project
  service     = google_cloudfunctions2_function.save_achievement_record_cover_image.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_record_cover_image" {
  name   = "cloud-functions/saveAchievementRecordCoverImage.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_record_cover_image" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-record-cover-image"
  description = "Save the cover image of an achievement record to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementRecordCoverImage"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_record_cover_image.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }

  lifecycle {
    create_before_destroy = false
  }
}

###############################################################################
# Create Google cloud function for saveAchievementRecordDocumentation
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_record_documentation_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_record_documentation.location
  project     = google_cloudfunctions2_function.save_achievement_record_documentation.project
  service     = google_cloudfunctions2_function.save_achievement_record_documentation.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_record_documentation" {
  name   = "cloud-functions/saveAchievementRecordDocumentation.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_record_documentation" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-record-documentation"
  description = "Save the documentation file of an achievement record to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementRecordDocumentation"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_record_documentation.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }

  lifecycle {
    create_before_destroy = false
  }
}

###############################################################################
# Create Google cloud function for saveCourseImage
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_course_image_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_course_image.location
  project     = google_cloudfunctions2_function.save_course_image.project
  service     = google_cloudfunctions2_function.save_course_image.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_course_image" {
  name   = "cloud-functions/saveCourseImage.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_course_image" {
  provider    = google-beta
  location    = var.region
  name        = "save-course-image"
  description = "Save the cover image of a course to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveCourseImage"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_course_image.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveParticipationCertificate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_participation_certificate_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_participation_certificate.location
  project     = google_cloudfunctions2_function.save_participation_certificate.project
  service     = google_cloudfunctions2_function.save_participation_certificate.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_participation_certificate" {
  name   = "cloud-functions/saveParticipationCertificate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_participation_certificate" {
  provider    = google-beta
  location    = var.region
  name        = "save-participation-certificate"
  description = "Saves a created participation certificate to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveParticipationCertificate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_participation_certificate.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveParticipationCertificateTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_participation_certificate_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_participation_certificate_template.location
  project     = google_cloudfunctions2_function.save_participation_certificate_template.project
  service     = google_cloudfunctions2_function.save_participation_certificate_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_participation_certificate_template" {
  name   = "cloud-functions/saveParticipationCertificateTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_participation_certificate_template" {
  provider    = google-beta
  location    = var.region
  name        = "save-participation-certificate-template"
  description = "Saves a participation certificate template (each program has its own)) to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveParticipationCertificateTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_participation_certificate_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveUserProfileImage
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_user_profile_image_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_user_profile_image.location
  project     = google_cloudfunctions2_function.save_user_profile_image.project
  service     = google_cloudfunctions2_function.save_user_profile_image.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_user_profile_image" {
  name   = "cloud-functions/saveUserProfileImage.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_user_profile_image" {
  provider    = google-beta
  location    = var.region
  name        = "save-user-profile-image"
  description = "Saves a user profile image to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveUserProfileImage"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_user_profile_image.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadAchievementOptionDocumentationTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_achievement_option_documentation_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_achievement_option_documentation_template.location
  project     = google_cloudfunctions2_function.load_achievement_option_documentation_template.project
  service     = google_cloudfunctions2_function.load_achievement_option_documentation_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_achievement_option_documentation_template" {
  name   = "cloud-functions/loadAchievementOptionDocumentationTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_achievement_option_documentation_template" {
  provider    = google-beta
  location    = var.region
  name        = "load-achievement-option-documentation-template"
  description = "Loads an achievement option documentation template from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadAchievementOptionDocumentationTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_achievement_option_documentation_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveAchievementOptionEvaluationScript
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_option_evaluation_script_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_option_evaluation_script.location
  project     = google_cloudfunctions2_function.save_achievement_option_evaluation_script.project
  service     = google_cloudfunctions2_function.save_achievement_option_evaluation_script.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_option_evaluation_script" {
  name   = "cloud-functions/saveAchievementOptionEvaluationScript.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_option_evaluation_script" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-option-evaluation-script"
  description = "Saves an achievement option evaluation script to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementOptionEvaluationScript"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_option_evaluation_script.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for loadAchievementOptionEvaluationScript
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "load_achievement_option_evaluation_script_noauth_invoker" {
  location    = google_cloudfunctions2_function.load_achievement_option_evaluation_script.location
  project     = google_cloudfunctions2_function.load_achievement_option_evaluation_script.project
  service     = google_cloudfunctions2_function.load_achievement_option_evaluation_script.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "load_achievement_option_evaluation_script" {
  name   = "cloud-functions/loadAchievementOptionEvaluationScript.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "load_achievement_option_evaluation_script" {
  provider    = google-beta
  location    = var.region
  name        = "load-achievement-option-evaluation-script"
  description = "Loads an achievement option evaluation script from Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "loadAchievementOptionEvaluationScript"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.load_achievement_option_evaluation_script.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for saveAchievementOptionDocumentationTemplate
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "save_achievement_option_documentation_template_noauth_invoker" {
  location    = google_cloudfunctions2_function.save_achievement_option_documentation_template.location
  project     = google_cloudfunctions2_function.save_achievement_option_documentation_template.project
  service     = google_cloudfunctions2_function.save_achievement_option_documentation_template.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "save_achievement_option_documentation_template" {
  name   = "cloud-functions/saveAchievementOptionDocumentationTemplate.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "save_achievement_option_documentation_template" {
  provider    = google-beta
  location    = var.region
  name        = "save-achievement-option-documentation-template"
  description = "Saves an achievement option documentation template to Google Cloud Storage"

  build_config {
    runtime     = "nodejs16"
    entry_point = "saveAchievementOptionDocumentationTemplate"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.save_achievement_option_documentation_template.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for sendMail
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "send_mail_noauth_invoker" {
  location    = google_cloudfunctions2_function.send_mail.location
  project     = google_cloudfunctions2_function.send_mail.project
  service     = google_cloudfunctions2_function.send_mail.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "send_mail" {
  name   = "cloud-functions/sendMail.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "send_mail" {
  provider    = google-beta
  location    = var.region
  name        = "send-mail"
  description = "Sends an email as defined in the Hasura mail log table"

  build_config {
    runtime     = "nodejs14"
    entry_point = "sendMail"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.send_mail.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      HASURA_MAIL_PW               = var.hasura_mail_pw
      HASURA_MAIL_USER             = var.hasura_mail_user
    }
    max_instance_count = 50
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for updateKeycloakProfile
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "update_keycloak_profile_noauth_invoker" {
  location    = google_cloudfunctions2_function.update_keycloak_profile.location
  project     = google_cloudfunctions2_function.update_keycloak_profile.project
  service     = google_cloudfunctions2_function.update_keycloak_profile.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "update_keycloak_profile" {
  name   = "cloud-functions/updateKeycloakProfile.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "update_keycloak_profile" {
  provider    = google-beta
  location    = var.region
  name        = "update-keycloak-profile"
  description = "Updates the Keycloak profile on changes in Hasura"

  build_config {
    runtime     = "nodejs14"
    entry_point = "updateKeycloakProfile"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_keycloak_profile.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      LEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https://${var.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}

###############################################################################
# Create Google cloud function for updateFromKeycloak
#####
# Apply IAM policy (see 'main.tf') which grants any user the privilige to invoke the serverless function
resource "google_cloud_run_service_iam_policy" "update_from_keycloak_noauth_invoker" {
  location    = google_cloudfunctions2_function.update_from_keycloak.location
  project     = google_cloudfunctions2_function.update_from_keycloak.project
  service     = google_cloudfunctions2_function.update_from_keycloak.name
  policy_data = data.google_iam_policy.noauth_invoker.policy_data
}
# Retrieve data object with zipped scource code
data "google_storage_bucket_object" "update_from_keycloak" {
  name   = "cloud-functions/updateFromKeycloak.zip"
  bucket = var.project_id
}
# Create cloud function
resource "google_cloudfunctions2_function" "update_from_keycloak" {
  provider    = google-beta
  location    = var.region
  name        = "update-from-keycloak"
  description = "Looks up keycloak user of given uuid and creates new hasura user if necessary or updates existing"

  build_config {
    runtime     = "nodejs14"
    entry_point = "updateFromKeycloak"
    source {
      storage_source {
        bucket = var.project_id
        object = data.google_storage_bucket_object.update_from_keycloak.name
      }
    }
  }

  service_config {
    environment_variables = {
      HASURA_CLOUD_FUNCTION_SECRET = var.hasura_cloud_function_secret
      KEYCLOAK_USER                = var.keycloak_user
      KEYCLOAK_URL                 = "https://${var.keycloak_service_name}.opencampus.sh"
      KEYCLOAK_PW                  = var.keycloak_pw
      HASURA_ENDPOINT              = "https://${var.hasura_service_name}.opencampus.sh/v1/graphql"
      HASURA_ADMIN_SECRET          = var.hasura_graphql_admin_key
    }
    max_instance_count = 1
    available_memory   = "256M"
    timeout_seconds    = 60
  }
}
