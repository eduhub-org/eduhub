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
- `vertex` (ADR 0005): Gemini on Vertex AI in the EU, with the zero-retention settings above.

`assistant_llm_model` is empty by default, which picks the provider's model from the trial.

The weekly summary of bug reports and feature ideas on `/manage/reports` (issue #2234) runs in
callNodeFunction with its own model, so it can use a stronger one than the chat. By default
(`summary_llm_provider` empty) it follows the Assistant: when the Assistant runs on `ionos` with a
key, the summary uses `Qwen/Qwen3.5-397B-A17B`, the strongest model on the IONOS AI Model Hub, with
the same key and with thinking turned off (`reasoning_effort: none`: the model's thinking would
count against the output cap and could outrun the function's 180 s). Otherwise no summary is
written. To show its cost with each summary, set `summary_llm_price_input_eur_per_mtok` /
`summary_llm_price_output_eur_per_mtok` from the IONOS price list.

To choose differently, set `summary_llm_provider`:

- `ionos` with another `summary_llm_model` from the IONOS AI Model Hub.
- `vertex`: Gemini on Vertex AI in `summary_llm_location` (default `eu`), with
  callNodeFunction's service account, which already has `roles/aiplatform.user`. Needs
  `summary_llm_model`. The zero-retention settings above apply to this model too.
- `off`: no summary.

One run sends at most 200 reports and 200 thumbs-down rows, each cut short, and caps the output at
6000 tokens.

To deny the global endpoint, the Terraform service account needs `roles/orgpolicy.policyAdmin`
on the organization. Then set `vertex_global_endpoint_policy` to `dry_run`, check the audit
logs for denied requests, and switch to `enforce`.
