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
