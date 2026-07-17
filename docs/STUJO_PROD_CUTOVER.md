# StuJo → EduHub production cutover

Two independent workstreams: **(A) data** (re-run the ETL against prod) and
**(B) domains** (move `stujo.net` traffic to the new app). Do A first and QA on
the `*.opencampus.sh` interim hosts; do B in a low-traffic window.

Prereqs already in place: the ETL (`scripts/stujo_etl.py`) with the
company/student spam filters + full delta upsert; the legacy 301 middleware
(`frontend-nx/apps/stujo/middleware.ts`); and the `JobPortalDomain` seed, which
already contains the `stujo.net` hosts (migration `1784400000000`).

---

## A. Data cutover (ETL against production)

Runner: **`scripts/stujo_migrate_prod.sh`** — a thin wrapper over
`stujo_migrate_gcp.sh` that sets the prod endpoints (all env-overridable) and
requires the prod-specific values so it can't be pointed at the wrong place by
accident. Run on a throwaway VM in the **production** GCP project (same pattern
as the staging run: VM SA needs `secretAccessor` on `hasura-graphql-admin-key`
+ `keycloak-pw` and `objectAdmin` on the prod uploads bucket).

Values you must supply (no safe defaults):

| Env | What | Note |
|---|---|---|
| `GCP_PROJECT` | prod project id | secrets + bucket live here |
| `GCS_BUCKET` | prod uploads bucket | |
| `HAW_ORG_ID` | prod `Organization.id` of HAW Kiel | **not 8** (that was staging) — look it up in prod Hasura |
| `STRATO_SSH_PASS` | prod StuJo SSH password | |
| `KEYCLOAK_USER` | defaults to `login@opencampus.sh` | staging used `keycloak` |

Steps:

1. **Deploy the new stujo app to prod** (Cloud Run) and QA on
   `stujo.opencampus.sh` + the `stujo-<portal>.opencampus.sh` hosts.
2. **Dry run:** `DRY_RUN=1 bash stujo_migrate_prod.sh 2>&1 | tee prod-dryrun.log`
   — validates source connectivity, previews the filtered scope.
3. **Full run:** `STUJO_PROD_CONFIRM=PROD bash stujo_migrate_prod.sh 2>&1 | tee prod-migrate.log`
4. **Verify** counts against prod Hasura (orgs with jobs, org admins, job
   postings by status, credits) — same queries used on staging.
5. **Freeze StuJo writes** on the Rails app (maintenance banner).
6. **Delta run:** re-run step 3. Thanks to the upsert it now reconciles
   edited/re-posted jobs, status changes and credit balances — not just new rows.
7. **Tear down the VM** (removes the on-disk SSH password + logs).

---

## B. Domain cutover checklist

| # | Task | Terraform? |
|---|---|---|
| 1 | `stujo.net` is a Cloudflare zone; registrar nameservers point at Cloudflare | zone: TF-able (`cloudflare_zone`); NS at registrar: **manual, one-time** |
| 2 | Add `stujo.net` + subdomains to the managed-cert SAN list | ✅ TF (`02_network.tf`) |
| 3 | Cloudflare A records for `stujo.net` hosts → LB IP (in the stujo.net zone) | ✅ TF |
| 4 | LB routes the `stujo.net` hosts to the `stujo` Cloud Run service | ✅ TF (host rules — the non-trivial piece, see below) |
| 5 | Confirm the new managed cert is **ACTIVE** before flipping traffic | manual verify |
| 6 | 301 middleware live (already committed) + `/arbeitgeber` route built if you want employer redirects | code |
| 7 | e-talents domains → static sunset page (plan §7.3) | out of scope here |
| 8 | Archive Rails DB + `public/system` snapshot; decommission | manual |

**⚠️ Cert re-provisioning window.** The managed cert is a single multi-SAN cert
whose domain list is immutable, so adding SANs provisions a *new* cert
(create-before-destroy). It only goes ACTIVE once every listed domain validates,
which needs the new A records resolving first. Expect a window (tens of minutes)
— apply off-peak and confirm ACTIVE before treating the new hosts as live. This
is already documented in `02_network.tf`.

---

## Can it be fully done in Terraform? — Yes.

Cert SANs, DNS records, and LB routing are all already TF-managed in
`infrastructure/application/`. The only non-TF bits are one-time/manual by
nature: pointing the `stujo.net` **registrar nameservers** at Cloudflare, and
**verifying** the cert reached ACTIVE. Everything else below is drop-in TF.

The one piece that is more than a one-liner is **routing**: today a single
serverless NEG uses `url_mask = "<service>.opencampus.sh"` to derive the Cloud
Run service from the hostname. `stujo.net` doesn't match that pattern, and the
host→service names don't line up (`cau.stujo.net` must reach service
`stujo-cau`). The clean fix relies on a fact about the app: **portal branding is
resolved from the request host** (`lib/portal.ts` → `JobPortalDomain` seed),
*independent of which Cloud Run service serves it*. So all `*.stujo.net` can
point at the single root `stujo` service and still render the right portal. That
turns routing into "host rules → one backend".

### Terraform code

**1) New variables** (`00_variables.tf`) — inert by default, so committing this
is a no-op until you set them at cutover:

```hcl
variable "stujo_net_hostnames" {
  description = "Real public StuJo hostnames to serve (stujo.net + subdomains). Empty until cutover."
  type        = list(string)
  default     = []
  # cutover value, e.g.:
  # ["stujo.net","www.stujo.net","cau.stujo.net","haw-kiel.stujo.net","fh-kiel.stujo.net","flensburg.stujo.net"]
}

variable "cloudflare_zone_id_stujo" {
  description = "Cloudflare zone id for the stujo.net domain (separate zone from opencampus.sh)."
  type        = string
  default     = ""
}
```

**2) Cert SANs** — extend the existing `concat(...)` in `02_network.tf`
(`module.lb-http.managed_ssl_certificate_domains`):

```hcl
managed_ssl_certificate_domains = concat(
  [
    "${local.keycloak_service_name}.opencampus.sh",
    "${local.hasura_service_name}.opencampus.sh",
    "${local.eduhub_service_name}.opencampus.sh",
    "${local.eduhub_api_service_name}.opencampus.sh",
    local.stujo_domain,
  ],
  [for portal in local.stujo_portals : portal.domain],
  var.stujo_net_hostnames,            # NEW — empty until cutover
)
```

**3) Cloudflare A records** in the `stujo.net` zone (`02_network.tf`):

```hcl
resource "cloudflare_record" "stujo_net" {
  for_each = toset(var.stujo_net_hostnames)

  zone_id = var.cloudflare_zone_id_stujo
  name    = each.value == "stujo.net" ? "@" : trimsuffix(each.value, ".stujo.net")
  type    = "A"
  value   = module.lb-http.external_ip
  # match the existing records (unproxied so the managed cert validates directly)
  proxied = false
}
```

**4) Routing — host rules → the root `stujo` service.** Add a serverless NEG
pinned to the `stujo` service (no url_mask), and route the `stujo.net` hosts to
it. The `GoogleCloudPlatform/lb-http//modules/serverless_negs` module abstracts
the URL map, so wiring host rules means using the module's host-rule inputs (or,
if the version in use doesn't expose them, adding a `google_compute_url_map`
that references the module's backend service). **Validate this against the module
version in `.terraform` and rehearse on staging first** — it's the only step
that touches live routing.

```hcl
# Pin a NEG to the root stujo service (branding is resolved by the app from the
# request host, so every *.stujo.net host can share this one backend).
resource "google_compute_region_network_endpoint_group" "stujo_net" {
  count                 = length(var.stujo_net_hostnames) > 0 ? 1 : 0
  provider              = google-beta
  name                  = "stujo-net-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = local.stujo_service_name   # the root "stujo" Cloud Run service
  }
  lifecycle { create_before_destroy = true }
}

# Then, in the load balancer's URL map, add a host rule matching
# var.stujo_net_hostnames to a backend service fronting the NEG above. With the
# lb-http module this is done via its host-rule/backends inputs; confirm the
# exact interface for the pinned module version before applying.
```

> Simpler-but-worse alternative: proxy `stujo.net` through Cloudflare and rewrite
> the `Host` header to `stujo.opencampus.sh` so the existing `url_mask` routes it.
> Rejected because it collapses every portal host to one, losing per-host portal
> branding unless the original host is forwarded and the app is taught to read it.

### Suggested apply order at cutover

1. Set `cloudflare_zone_id_stujo` + `stujo_net_hostnames`; `terraform apply` the
   **A records first** (or same apply — records must resolve for cert validation).
2. Apply the **cert SAN** change; wait for the new managed cert to be **ACTIVE**
   (check in the console / `gcloud compute ssl-certificates describe`).
3. Apply the **routing** (NEG + host rules).
4. Smoke-test each host over HTTPS, then flip / announce.

### Rollback

DNS is the switch: revert the `stujo.net` A records (or lower TTL beforehand and
point back at the Rails server) to fall back. The GCP-side resources (cert SANs,
NEG, host rules) are additive and safe to leave in place.
