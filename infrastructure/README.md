# Application Infrastructure

To run the code to setup the infrastructure for EduHub application and deploy it, the variables listed in the following are needed.
They should be defined within a variable set, so it can be used by the staging and the production environment in the same way.

(1) **keycloak_db_name**
    - The JSON key for the service account created in the project of the Google Cloud Platform.
    - To insert it, remove the newline characters (see also instruction [here](https://www.haigmail.com/2019/10/07/setting-up-google_credentials-for-terraform-cloud/)).  
    - Mark the variable as sensitive.
(2) **keycloak_db_user**
    - Must be equivalent to the name of the created Google Cloud project for which the above service account has credentials.
(3) **keycloak_db_pw**
    - Region for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(4) **keycloak_db_tier**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(5) **keycloak_db_availability**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(6) **keycloak_user**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(7) **keycloak_pw**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(8) **docker_image_keycloak**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(9) **google_service_account**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(9) **keycloak_domain**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
(9) **url_mask**
    - Zone for the Google Cloud Server, where the artifact registry as well as all other infrastructure will be instantiated.
