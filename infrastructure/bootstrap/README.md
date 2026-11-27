# Bootstrap a Google Cloud project

`bootstrap.sh` sets up a Google Cloud project with everything the application
Terraform workspace (`infrastructure/application`) expects before its first
run. Why this is a script and not Terraform: [ADR 0009](../../docs/adr/0009-bootstrap-gcp-projects-by-script.md).

## What it sets up

- The project under the given folder or organization, linked to the billing
  account.
- The APIs EduHub needs (list in the script).
- The `terraform` service account: `roles/editor` on the project, and
  `roles/iam.serviceAccountTokenCreator` and `roles/iam.serviceAccountAdmin`
  on itself.
- The `github` service account (CI), with `roles/iam.serviceAccountKeyAdmin`
  on it for the key-managing user, so that user can issue its JSON key.
- The `docker-repo` Artifact Registry repository (Docker) in the region:
  `allUsers` reader, `github` writer, `terraform` repo admin.
- The main bucket `gs://<project-id>` in the region, with a lifecycle rule that
  deletes `temp/` objects after 7 days, and `github` as object admin.

It makes no assumptions about an organization's groups, folders or
organization-level roles; set those up separately.

## Rules

- **Idempotent.** Every step checks first and only creates or grants what is
  missing. After a failure, fix the cause and run it again.
- **Never turns anything off.** It doesn't disable APIs, remove permissions,
  move the project, change its billing account or replace bucket lifecycle
  rules. Where something differs, it prints a warning and leaves it.
- **New APIs belong in the application workspace.** A feature that needs
  another Google API enables it next to the feature in
  `infrastructure/application`, with `disable_on_destroy = false`, as
  `aiplatform`, `billingbudgets` and `orgpolicy` already are. Don't add it to
  the script.

## Usage

Needs `gcloud` and `jq`, logged in (`gcloud auth login`) as a user who may
create projects under the parent, link the billing account and administer IAM
in the project. Look first, then apply:

```bash
infrastructure/bootstrap/bootstrap.sh \
  --project-id eduhub-example \
  --project-name "EduHub Example" \
  --billing-account XXXXXX-XXXXXX-XXXXXX \
  --parent folders/123456789012 \
  --region europe-west1 \
  --key-user admin@example.org \
  --dry-run
```

Without `--dry-run` it applies the `PLAN:` lines. Each output line is `OK:`
(already there), `PLAN:`/`DO:` (missing, would be or is being created or
granted) or `WARNING:` (differs, left alone). It ends with
`Nothing to create or grant.` when the project is complete.

`--parent` is `folders/N` or `organizations/N`. Don't commit the real billing
account, parent or user to this repository.

## The steps around the script

1. **Run the script** (above).
2. **HCP Terraform workspace.** In the `opencampus` organization (or your
   own; it's set in `infrastructure/application/01_main.tf`), create a
   CLI-driven workspace for the environment. Give it:
   - the variable set with the shared variables of
     `infrastructure/application/00_variables.tf` (at opencampus.sh:
     `eduhub-application`);
   - the workspace variables for this environment (`project_id`, `region`,
     `zone`, the service names and URLs);
   - `GOOGLE_CREDENTIALS` as a sensitive environment variable: a JSON key of
     the `terraform` service account with its newlines removed.

   ```bash
   gcloud iam service-accounts keys create terraform-key.json \
     --iam-account terraform@<project-id>.iam.gserviceaccount.com
   ```

   Delete the local key file once it's stored.
3. **CI key.** The key-managing user issues a JSON key of the `github`
   service account:

   ```bash
   gcloud iam service-accounts keys create github-key.json \
     --iam-account github@<project-id>.iam.gserviceaccount.com
   ```

4. **GitHub.** In the repository's GitHub environment for the branch
   (`staging`, `production`), set the variables `PROJECT_ID`, `TF_WORKSPACE`,
   `TF_WORKSPACE_ID` and the `NEXT_PUBLIC_*` URLs, and store the `github` key
   as the secret the workflow reads (`GCP_EDUHUB_STAGING_KEY` or
   `GCP_EDUHUB_PRODUCTION_KEY`). `TF_API_TOKEN` and `GCP_REGION` are shared
   repository secrets. Delete the local key file afterwards.
5. **First deployment.** Push to the branch; the infrastructure workflow
   builds the images and runs `terraform apply` in `infrastructure/application`.
