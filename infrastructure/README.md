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

## Assistant: provider and zero retention (ADR 0005, ADR 0008)

`application/11_assistant.tf` grants the edu service access to Vertex AI and can deny
the global endpoint. Two settings are outside Terraform and must be checked once per
project (staging and production), with an account that has `roles/aiplatform.admin`:

- **Caching off.** google provider 6.x has no resource for the cache config, so set it
  with the API. It is a project setting; the regional host only routes the request.

  ```bash
  P=eduhub-staging-new; H=https://europe-west1-aiplatform.googleapis.com/v1/projects/$P/cacheConfig; T=$(gcloud auth print-access-token); curl -sf -X PATCH -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d "{\"name\":\"projects/$P/cacheConfig\",\"disableCache\":true}" "$H" >/dev/null && curl -s -H "Authorization: Bearer $T" "$H"
  ```

  The second call must print `"disableCache": true`. Once the provider is upgraded to a
  version with `google_vertex_ai_cache_config`, move this into Terraform.
- **Request-response logging off.** It is off until a PublisherModelConfig enables it.
  Check that `fetchPublisherModelConfig` answers 404 (not configured) for the model in use:

  ```bash
  P=eduhub-staging-new; M=gemini-3.8-flash; curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $(gcloud auth print-access-token)" "https://aiplatform.eu.rep.googleapis.com/v1beta1/projects/$P/locations/eu/publishers/google/models/$M:fetchPublisherModelConfig"
  ```

To turn the Assistant on, set `assistant_llm_provider` and the model's prices
`assistant_llm_price_input_eur_per_mtok` / `assistant_llm_price_output_eur_per_mtok` (EUR per
million tokens, from the provider's price list). The monthly spending cap
(`assistant_monthly_spend_cap_eur`) is measured with them; without prices the Assistant stays off.

- `ionos` (ADR 0008): Qwen3.8 27B on the IONOS AI Model Hub. Put the token value of an IONOS
  AI Model Hub token into the sensitive `assistant_llm_api_key` (variable set
  `eduhub-application`); Terraform keeps it in Secret Manager. While it's empty, the Assistant
  stays off. Prices for `Qwen/Qwen3.8-27B`: 0.40 / 2.70.

  **Renewing the IONOS token.** An AI Model Hub token lives at most 365 days and Terraform can't
  renew it (the IONOS provider has no resource for API tokens). Create it with the full TTL and
  set a reminder two weeks before it expires. To renew: create a new token in the IONOS Token
  Manager, replace `assistant_llm_api_key`, redeploy staging and production, then delete the old
  token. If it expires anyway, the alert `EduHub Assistant: provider rejects the credentials`
  posts to the Slack channel of `alert_slack_channel_id` (`10_monitoring.tf`).
- `vertex` (ADR 0005): Gemini on Vertex AI in the EU, with the zero-retention settings above.

`assistant_llm_model` is empty by default, which picks the provider's model from the trial.

To deny the global endpoint, the Terraform service account needs `roles/orgpolicy.policyAdmin`
on the organization. Then set `vertex_global_endpoint_policy` to `dry_run`, check the audit
logs for denied requests, and switch to `enforce`.
