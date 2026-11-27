# ADR 0009: Bootstrap Google Cloud projects with a script

## Status
Accepted (2026-11-27)

## Context

The `opencampus` HCP Terraform organization is on the Free plan, which allows
500 managed resources. It held 505, and HCP Terraform warned that service
would be interrupted unless the count dropped or the plan was upgraded.

122 of those resources sat in three workspaces that only did one-time setup
and had not changed since mid-2022:

- the two EduHub foundation workspaces (production and staging, 47 resources
  each), run from `infrastructure/foundation`: they created each Google Cloud
  project, enabled its APIs, and created the `terraform` and `github` service
  accounts, the Docker registry, the main bucket and their permissions;
- `gcp-foundations` (28), the opencampus.sh organization's setup (admin
  groups' roles, folders), whose code was never in this repository.

Nothing reads their state: the application workspaces and CI only use the
existing project and service accounts. The workspaces still counted against
the limit, ran Terraform 1.2/1.3 with 2021 providers, and a destroy run on
one of them would delete a whole project.

## Decision

1. **A script sets up a new project.** `infrastructure/bootstrap/bootstrap.sh`
   (bash + `gcloud`) creates what the application workspace expects before
   its first run, from parameters (project ID and name, billing account,
   parent folder or organization, region, key-managing user). It checks each
   resource and only creates or grants what's missing; it never disables,
   removes or changes anything. `--dry-run` prints the plan.
2. **The API list is cleaned up.** It is the foundation list minus APIs Google
   has shut down or EduHub doesn't use (`clouddebugger`, `deploymentmanager`,
   `datastore`, `firestore`, `firebaserules`, and a duplicate entry). They
   stay enabled in the existing projects; nothing turns them off.
3. **Later APIs live in the application workspace**, next to the feature that
   needs them, with `disable_on_destroy = false` (as `aiplatform`,
   `billingbudgets` and `orgpolicy` already are).
4. **The foundation Terraform root is removed** and the three workspaces are
   retired: their state is backed up outside Git, then the workspaces are
   force-deleted, which leaves everything in Google Cloud as it is.
5. **Organization setup is not EduHub's.** The script takes an existing
   folder or organization and assumes nothing about its groups or folders.
   opencampus.sh documents its organization setup in its internal docs.

## Considered options

- **Keep the workspaces:** the count stays over the limit, so the plan would
  have to be upgraded, and the destroy risk stays.
- **Upgrade the HCP Terraform plan:** a recurring cost for resources that
  don't change, and the count grows again with the application.
- **Google's Terraform `0-bootstrap` stage** (Cloud Foundation Fabric /
  terraform-example-foundation): built for whole organizations with seed
  projects and its own state bucket; far more than one project needs, and
  its resources would still be managed resources somewhere.

## Consequences

- No drift detection for the bootstrap part. Running the script with
  `--dry-run` is the check; it reports anything missing. When written, it
  found the 7-day `temp/` lifecycle rule missing on both existing buckets
  (everything else matched); applying it is a separate decision.
- New Google APIs are enabled in the application workspace, so they come and
  go with the features that need them.
- The opencampus.sh organization setup (admin groups, `Production` /
  `Staging` / `Shared` folders, organization roles) is documented outside
  this repository.
- CI keeps signing in with the `github` service account's JSON key; keyless
  sign-in (Workload Identity Federation) is a separate decision.
