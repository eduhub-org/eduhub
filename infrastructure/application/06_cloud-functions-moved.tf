###############################################################################
# Addresses before the cloud_function module (06_cloud-functions.tf), so the
# existing functions and their IAM are moved in state, not recreated.
# Keep until every workspace (staging, production) has applied them; then
# they can go (docs/plans/functions-topology-cleanup.md).
#####

moved {
  from = google_cloudfunctions2_function.api_proxy
  to   = module.cloud_function["api_proxy"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.call_python_function
  to   = module.cloud_function["call_python_function"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.call_node_function
  to   = module.cloud_function["call_node_function"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.send_mail
  to   = module.cloud_function["send_mail"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.add_keycloak_role
  to   = module.cloud_function["add_keycloak_role"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.remove_keycloak_role
  to   = module.cloud_function["remove_keycloak_role"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.update_from_keycloak
  to   = module.cloud_function["update_from_keycloak"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloudfunctions2_function.send_questionaires
  to   = module.cloud_function["send_questionaires"].google_cloudfunctions2_function.this
}

moved {
  from = google_cloud_run_service_iam_policy.call_python_function_noauth_invoker
  to   = module.cloud_function["call_python_function"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.call_node_function_noauth_invoker
  to   = module.cloud_function["call_node_function"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.send_mail_noauth_invoker
  to   = module.cloud_function["send_mail"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.add_keycloak_role_noauth_invoker
  to   = module.cloud_function["add_keycloak_role"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.remove_keycloak_role_noauth_invoker
  to   = module.cloud_function["remove_keycloak_role"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.update_from_keycloak_noauth_invoker
  to   = module.cloud_function["update_from_keycloak"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_policy.send_questionaires_noauth_invoker
  to   = module.cloud_function["send_questionaires"].google_cloud_run_service_iam_policy.noauth_invoker[0]
}

moved {
  from = google_cloud_run_service_iam_binding.api_proxy_noauth
  to   = module.cloud_function["api_proxy"].google_cloud_run_service_iam_binding.noauth_invoker[0]
}

# sendMail now runs as its own account (cf-send-mail, granted in the module).
# Its three grants on the shared account were never used by sendMail itself:
# - the Mailgun one is what callPythonFunction reads, so it stays, renamed;
moved {
  from = google_secret_manager_secret_iam_member.send_mail_mailgun_api_key
  to   = google_secret_manager_secret_iam_member.call_python_function_mailgun_api_key
}

# - the HASURA_CLOUD_FUNCTION_SECRET one duplicates
#   call_python_function_cloud_secret_access and
#   call_node_function_cloud_function_secret; destroying it would revoke the
#   binding they manage, so it stays declared (06_cloud-functions.tf). The
#   workspaces run Terraform 1.3, which has no `removed` block; drop it from
#   state once they run >= 1.7 (see docs/plans/functions-topology-cleanup.md).

# - send_mail_hasura_mail_pw (HASURA_MAIL_PW on the shared account) has no
#   reader and is destroyed.
