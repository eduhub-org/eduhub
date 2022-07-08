###############################################################################
# Definition of the used Terraform variables
#####

variable "org_id" {
  description = "The Google Cloud organization id for the associated resources"
  type        = string
}

variable "billing_account" {
  description = "The id of the Google Cloud billing account to associate projects with"
  type        = string
}

variable "folder_id" {
  description = "The id of the folder in which the Google Cloud project is created. Should corespond to the respective branch of the hosted application."
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

variable "project_name" {
  description = "The name of the Google Cloud project that is created"
  type        = string
}

variable "project_id" {
  description = "The id of the Google Cloud project that is created"
  type        = string
}

variable "key_generation_user" {
  description = "The Google user that will get permission to create a JSON key for the service account that will be used to setup the application infrastructure in the project."
  type        = string
}
