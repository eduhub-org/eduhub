#!/usr/bin/env bash
#
# Bootstrap a Google Cloud project for EduHub: everything the application
# Terraform workspace (infrastructure/application) expects to exist before its
# first run. See README.md next to this file and docs/adr/0009.
#
# Idempotent: every step checks first and only adds what is missing (such as
# the temp/ lifecycle rule on a bucket that has no lifecycle rules). It never
# disables an API, removes a permission, or replaces or changes an existing
# setting; where something differs it prints a WARNING and leaves it. Run it
# again after a failure; with --dry-run it only prints what it would do.
#
# Needs: gcloud (logged in as a user who may create projects under the parent,
# link the billing account and administer IAM in the project) and jq. Steps
# 1-3 bill their API calls to the caller's own gcloud quota project, which
# needs the Cloud Billing and Service Usage APIs enabled.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bootstrap.sh --project-id ID --project-name NAME
                    --billing-account ACCOUNT_ID --parent folders/N|organizations/N
                    --region REGION --key-user EMAIL [--dry-run]

  --project-id       Google Cloud project ID (also the main bucket's name)
  --project-name     Display name of the project
  --billing-account  Billing account ID (XXXXXX-XXXXXX-XXXXXX)
  --parent           Folder or organization the project is created in
  --region           Region for the Docker registry and the bucket
  --key-user         User who may create JSON keys for the github account
  --dry-run          Print the planned actions; change nothing
EOF
}

PROJECT_ID="" PROJECT_NAME="" BILLING_ACCOUNT="" PARENT="" REGION="" KEY_USER=""
DRY_RUN=false

while (($#)); do
  case "$1" in
    --project-id) PROJECT_ID="${2:-}"; shift 2 ;;
    --project-name) PROJECT_NAME="${2:-}"; shift 2 ;;
    --billing-account) BILLING_ACCOUNT="${2:-}"; shift 2 ;;
    --parent) PARENT="${2:-}"; shift 2 ;;
    --region) REGION="${2:-}"; shift 2 ;;
    --key-user) KEY_USER="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h | --help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for var in PROJECT_ID PROJECT_NAME BILLING_ACCOUNT PARENT REGION KEY_USER; do
  if [[ -z "${!var}" ]]; then
    echo "Missing required parameter for $var" >&2
    usage >&2
    exit 2
  fi
done

for tool in gcloud jq; do
  command -v "$tool" >/dev/null || { echo "$tool is required" >&2; exit 2; }
done

case "$PARENT" in
  folders/[0-9]*) PARENT_FLAG=(--folder "${PARENT#folders/}") ;;
  organizations/[0-9]*) PARENT_FLAG=(--organization "${PARENT#organizations/}") ;;
  *) echo "--parent must be folders/N or organizations/N" >&2; exit 2 ;;
esac

# APIs the application workspace and the functions need. APIs that later
# features need are enabled in infrastructure/application with
# google_project_service and disable_on_destroy = false, not here.
APIS=(
  artifactregistry.googleapis.com  # Docker images
  cloudapis.googleapis.com
  cloudbilling.googleapis.com
  cloudbuild.googleapis.com        # builds of the gen2 Cloud Functions
  cloudfunctions.googleapis.com
  cloudresourcemanager.googleapis.com
  cloudtrace.googleapis.com
  compute.googleapis.com           # VPC network, load balancer
  eventarc.googleapis.com          # gen2 Cloud Functions
  iam.googleapis.com
  iamcredentials.googleapis.com
  logging.googleapis.com
  monitoring.googleapis.com        # alert policies, dashboard
  oslogin.googleapis.com           # enabled together with compute anyway
  pubsub.googleapis.com            # gen2 Cloud Functions
  run.googleapis.com
  secretmanager.googleapis.com
  servicemanagement.googleapis.com
  servicenetworking.googleapis.com # private Cloud SQL connection
  serviceusage.googleapis.com
  sql-component.googleapis.com
  sqladmin.googleapis.com
  storage-api.googleapis.com
  storage-component.googleapis.com
  storage.googleapis.com
  vpcaccess.googleapis.com         # Serverless VPC Access connector
)

TF_SA="terraform@${PROJECT_ID}.iam.gserviceaccount.com"
GH_SA="github@${PROJECT_ID}.iam.gserviceaccount.com"
REPO="docker-repo"
BUCKET="gs://${PROJECT_ID}"

PLANNED=0
WARNINGS=0
PROJECT_EXISTS=true

log() { printf '%s\n' "$*"; }
warn() { printf 'WARNING: %s\n' "$*" >&2; WARNINGS=$((WARNINGS + 1)); }

# act DESCRIPTION -- COMMAND...: print and (unless --dry-run) run a change.
act() {
  local desc="$1"
  shift 2
  PLANNED=$((PLANNED + 1))
  if $DRY_RUN; then
    log "PLAN: $desc"
  else
    log "DO:   $desc"
    retry "$@"
  fi
}

# A freshly created service account takes a few seconds to become visible
# to IAM, so retry changes a few times before giving up.
retry() {
  local attempt
  for attempt in 1 2 3 4 5; do
    if "$@" >/dev/null; then return 0; fi
    ((attempt < 5)) && sleep 5
  done
  echo "Failed: $*" >&2
  return 1
}

ok() { log "OK:   $*"; }

# has_binding ROLE MEMBER GCLOUD_GET_IAM_POLICY_ARGS...
# Returns 0 if MEMBER has ROLE without a condition, 2 if only with a
# condition (which may have expired), 1 if not at all.
has_binding() {
  local role="$1" member="$2" policy
  shift 2
  $PROJECT_EXISTS || return 1
  policy="$(gcloud "$@" --format=json 2>/dev/null)" || return 1
  return "$(jq --arg r "$role" --arg m "$member" '
    [(.bindings // [])[]
      | select(.role == $r and ((.members // []) | index($m)))]
    | if any(.[]; .condition == null) then 0
      elif length > 0 then 2 else 1 end' <<<"$policy")"
}

ensure_binding() {
  local kind="$1" target="$2" role="$3" member="$4"
  local get add
  case "$kind" in
    project)
      get=(projects get-iam-policy "$target")
      add=(projects add-iam-policy-binding "$target" --condition=None)
      ;;
    service-account)
      get=(iam service-accounts get-iam-policy "$target" --project "$PROJECT_ID")
      add=(iam service-accounts add-iam-policy-binding "$target"
        --project "$PROJECT_ID")
      ;;
    repository)
      get=(artifacts repositories get-iam-policy "$target"
        --location "$REGION" --project "$PROJECT_ID")
      add=(artifacts repositories add-iam-policy-binding "$target"
        --location "$REGION" --project "$PROJECT_ID")
      ;;
    bucket)
      get=(storage buckets get-iam-policy "$target")
      add=(storage buckets add-iam-policy-binding "$target")
      ;;
  esac
  local status=0
  has_binding "$role" "$member" "${get[@]}" || status=$?
  case "$status" in
    0) ok "$role for $member on $kind $target" ;;
    2) warn "$member has $role on $kind $target only with a condition;" \
      "leaving it (an expired condition grants nothing)" ;;
    *) act "grant $role to $member on $kind $target" -- \
      gcloud "${add[@]}" --role "$role" --member "$member" ;;
  esac
}

exists() { $PROJECT_EXISTS && "$@" >/dev/null 2>&1; }

log "Bootstrap of project $PROJECT_ID$($DRY_RUN && echo ' (dry run)')"

# 1. Project under the parent ------------------------------------------------
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  actual_parent="$(gcloud projects describe "$PROJECT_ID" \
    --format='value(parent.type,parent.id)' | tr '\t' ' ')"
  case "$actual_parent" in
    "folder ${PARENT#folders/}" | "organization ${PARENT#organizations/}")
      ok "project $PROJECT_ID under $PARENT" ;;
    *) warn "project $PROJECT_ID is under '$actual_parent', not $PARENT;" \
      "leaving it where it is" ;;
  esac
else
  PROJECT_EXISTS=false
  act "create project $PROJECT_ID ('$PROJECT_NAME') under $PARENT" -- \
    gcloud projects create "$PROJECT_ID" --name "$PROJECT_NAME" \
    "${PARENT_FLAG[@]}"
  $DRY_RUN || PROJECT_EXISTS=true
fi

# 2. Billing -----------------------------------------------------------------
billing=""
if $PROJECT_EXISTS; then
  billing="$(gcloud billing projects describe "$PROJECT_ID" \
    --format='value(billingAccountName)')"
fi
if [[ "$billing" == "billingAccounts/$BILLING_ACCOUNT" ]]; then
  ok "project linked to the billing account"
elif [[ -n "$billing" ]]; then
  warn "project is linked to another billing account; leaving it"
else
  act "link project to billing account" -- \
    gcloud billing projects link "$PROJECT_ID" \
    --billing-account "$BILLING_ACCOUNT"
fi

# 3. APIs ----------------------------------------------------------------------
enabled=""
if $PROJECT_EXISTS; then
  enabled="$(gcloud services list --enabled --project "$PROJECT_ID" \
    --format='value(config.name)')"
fi
missing_apis=()
for api in "${APIS[@]}"; do
  grep -qxF "$api" <<<"$enabled" || missing_apis+=("$api")
done
if ((${#missing_apis[@]})); then
  act "enable APIs: ${missing_apis[*]}" -- \
    gcloud services enable "${missing_apis[@]}" --project "$PROJECT_ID"
else
  ok "all ${#APIS[@]} APIs enabled"
fi

# From here on, bill API calls to the project itself rather than the caller's
# quota project. Only now: a new project has the APIs this needs (iam,
# artifactregistry, storage, ...) only after step 3.
if $PROJECT_EXISTS && { ! $DRY_RUN || ((${#missing_apis[@]} == 0)); }; then
  export CLOUDSDK_BILLING_QUOTA_PROJECT="$PROJECT_ID"
fi

# 4. Service accounts ------------------------------------------------------
ensure_sa() {
  local id="$1" name="$2" email="$1@${PROJECT_ID}.iam.gserviceaccount.com"
  if exists gcloud iam service-accounts describe "$email" \
    --project "$PROJECT_ID"; then
    ok "service account $email"
  else
    act "create service account $email" -- \
      gcloud iam service-accounts create "$id" --display-name "$name" \
      --project "$PROJECT_ID"
  fi
}
ensure_sa terraform "Terraform Service Account"
ensure_sa github "GitHub Service Account"

# 5. Permissions of the terraform account -------------------------------------
ensure_binding project "$PROJECT_ID" roles/editor "serviceAccount:$TF_SA"
ensure_binding service-account "$TF_SA" roles/iam.serviceAccountTokenCreator \
  "serviceAccount:$TF_SA"
ensure_binding service-account "$TF_SA" roles/iam.serviceAccountAdmin \
  "serviceAccount:$TF_SA"

# 6. Key-managing user may create JSON keys for the github account ------------
ensure_binding service-account "$GH_SA" roles/iam.serviceAccountKeyAdmin \
  "user:$KEY_USER"

# 7. Docker registry ---------------------------------------------------------
if exists gcloud artifacts repositories describe "$REPO" \
  --location "$REGION" --project "$PROJECT_ID"; then
  ok "Artifact Registry repository $REPO in $REGION"
else
  act "create Docker repository $REPO in $REGION" -- \
    gcloud artifacts repositories create "$REPO" --repository-format=docker \
    --location "$REGION" --project "$PROJECT_ID"
fi
ensure_binding repository "$REPO" roles/artifactregistry.reader allUsers
ensure_binding repository "$REPO" roles/artifactregistry.writer \
  "serviceAccount:$GH_SA"
ensure_binding repository "$REPO" roles/artifactregistry.repoAdmin \
  "serviceAccount:$TF_SA"

# 8. Main bucket -------------------------------------------------------------
LIFECYCLE='{"rule":[{"action":{"type":"Delete"},'
LIFECYCLE+='"condition":{"age":7,"matchesPrefix":["temp/"]}}]}'
if exists gcloud storage buckets describe "$BUCKET"; then
  ok "bucket $BUCKET"
  rules="$(gcloud storage buckets describe "$BUCKET" \
    --format='json(lifecycle_config)' | jq -c '.lifecycle_config.rule // []')"
  if jq -e 'any(.[]; .action.type == "Delete" and .condition.age == 7
      and ((.condition.matchesPrefix // []) | index("temp/")))' \
    <<<"$rules" >/dev/null; then
    ok "bucket lifecycle rule: delete temp/ after 7 days"
  elif [[ "$rules" != "[]" ]]; then
    warn "bucket has other lifecycle rules and none deletes temp/ after" \
      "7 days; add it by hand (setting it here would replace them)"
  else
    lifecycle_file="$(mktemp)"
    trap 'rm -f "$lifecycle_file"' EXIT
    printf '%s\n' "$LIFECYCLE" >"$lifecycle_file"
    act "add lifecycle rule to $BUCKET: delete temp/ after 7 days" -- \
      gcloud storage buckets update "$BUCKET" \
      --lifecycle-file "$lifecycle_file"
  fi
else
  lifecycle_file="$(mktemp)"
  trap 'rm -f "$lifecycle_file"' EXIT
  printf '%s\n' "$LIFECYCLE" >"$lifecycle_file"
  act "create bucket $BUCKET in $REGION (delete temp/ after 7 days)" -- \
    gcloud storage buckets create "$BUCKET" --project "$PROJECT_ID" \
    --location "$REGION" --lifecycle-file "$lifecycle_file"
fi
ensure_binding bucket "$BUCKET" roles/storage.objectAdmin \
  "serviceAccount:$GH_SA"

# Summary --------------------------------------------------------------------
log ""
if ((PLANNED == 0)); then
  log "Nothing to create or grant."
elif $DRY_RUN; then
  log "$PLANNED action(s) planned. Run without --dry-run to apply them."
else
  log "$PLANNED action(s) applied."
fi
((WARNINGS == 0)) || log "$WARNINGS warning(s); see above."
