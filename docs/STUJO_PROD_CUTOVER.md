# StuJo → EduHub production cutover

How the old Rails StuJo is replaced by the app in this repo, and how `stujo.net`
starts pointing at it. Two workstreams that meet only at the end:

- **A — data:** run the ETL against production (§3). Independent of DNS.
- **B — domain:** serve `stujo.net` from the new app (§4). Independent of data,
  except that the legacy job redirects can only resolve once the data is in.

Do A first and QA on the interim `*.opencampus.sh` hosts; do B in a low-traffic
window. Everything in B is driven by two Terraform switches, so the switch-over
is an apply, not a merge — nothing has to be held back in review.

Companion documents: [`STUJO_INTEGRATION_PLAN.md`](./STUJO_INTEGRATION_PLAN.md)
(the full integration, §7.3 is the original cutover sketch) and
[`../frontend-nx/apps/stujo/README.md`](../frontend-nx/apps/stujo/README.md).

---

## 1. What is already in place

| Piece | Where | State |
|---|---|---|
| Schema, permissions, crons, seeds | `backend/migrations`, `backend/metadata` | applied on staging, promoted with the release |
| Hostname → portal mapping | migration `1784400000000_create_table_public_JobPortalDomain` | seeds the `stujo.net` hosts **and** the interim `opencampus.sh` aliases |
| App + white-label portals | `frontend-nx/apps/stujo`, `infrastructure/application/08_stujo.tf` | live on `stujo.opencampus.sh` + `stujo-<portal>.opencampus.sh` |
| ETL | `scripts/stujo_etl.py`, `scripts/stujo_migrate_gcp.sh` | run end-to-end against staging, idempotent, with delta upsert |
| Production ETL runner | `scripts/stujo_migrate_prod.sh` | this change |
| Legacy 301s | `frontend-nx/apps/stujo/proxy.ts` | this change, off until `STUJO_CANONICAL_REDIRECTS=true` |
| `stujo.net` load balancer + DNS | `infrastructure/application/09_stujo_net.tf` | this change, inert until the switches below |

### The two Terraform switches

Both live in the **production** Terraform Cloud workspace and are `false`
everywhere until set (staging never sets them):

| Variable | What it does | When |
|---|---|---|
| `stujo_net_enabled` | Creates the stujo.net load balancer, its managed certificate and the Cloudflare A records. The app keeps answering on `*.opencampus.sh` exactly as before — stujo.net simply starts working too. | §4 step 1 |
| `stujo_net_canonical` | Makes stujo.net canonical: `NEXTAUTH_URL`, mail links, Stripe return URLs and edu-hub's job links move over, and the interim hosts 301 to stujo.net. | §4 step 4, after the certificate is ACTIVE |

Plus `cloudflare_zone_id_stujo` (the zone id of the stujo.net zone — a different
zone from opencampus.sh) and, if the legacy locale hosts exist,
`stujo_net_redirect_hostnames`.

> **Why a second load balancer?** The shared one uses a single multi-SAN managed
> certificate — adding stujo.net to it re-provisions the certificate for
> Keycloak, Hasura, EduHub and the API as well, and the new certificate only
> goes ACTIVE once *every* domain on it validates. It also derives the Cloud Run
> service from the hostname via `url_mask` (`<service>.opencampus.sh`), which
> cannot express `cau.stujo.net → stujo-cau`. A dedicated load balancer for
> stujo.net costs ~$18/month and can only ever break stujo.net. Rationale in
> the header of `09_stujo_net.tf`.

---

## 2. Phase 0 — preparation (can all be done before the window)

1. **Inventory the `stujo.net` Cloudflare zone.** Export the records and split
   them into three groups:
   - *web records to replace* — the A/CNAME records pointing at the Strato
     server (apex, `www`, the portal subdomains, and any `en.*` host);
   - *records that must stay untouched* — MX, SPF/DKIM/DMARC TXT, and anything
     for other services;
   - *hosts nobody uses any more* — decide explicitly to drop them, since every
     host that should keep working has to be listed in `stujo_net_hosts` (it
     serves) or `stujo_net_redirect_hostnames` (it only 301s). Google-managed
     certificates have **no wildcards**, so an unlisted host gets a TLS error,
     not a redirect.
   Then reconcile that list with `var.stujo_net_hosts` (default: apex, `www`,
   `cau`, `haw-kiel`, `fh-kiel`, `flensburg`) and with the `JobPortalDomain`
   seed, which is what resolves the branding per host.
2. **Mail.** The job-board templates send from `noreply@stujo.net`
   (`publishJobPosting`, `expire_job_postings`, the claim mails). Confirm
   Mailgun's sending records for `stujo.net` exist in the *new* zone and that
   the domain still verifies — moving DNS providers is exactly when SPF/DKIM
   get lost. Send one test mail before the window.
3. **Lower the TTL** to 60s on every record from group 1 (`stujo_net_record_ttl`
   covers the new records; the old ones are changed in the dashboard). Raise it
   again a few days after the cutover.
4. **Keycloak (prod realm `edu-hub`, client `hasura`):** add the stujo.net
   redirect URIs and web origins (`https://stujo.net/*`, `https://www.stujo.net/*`,
   and one per portal host). Without them, login on the new domain fails at the
   callback — and this is the one step no Terraform in this repo performs.
5. **Stripe (live):** job posting prices + tax rate bootstrapped
   (`createStripeJobPostingPrices`), webhook endpoint subscribed to
   `checkout.session.completed` **and** `invoice.finalized`, and the workspace
   variables `stujo_admin_email`, `stujo_seller_organization_id`,
   `stripe_tax_rate_id` set as intended.
6. **Look up `HAW_ORG_ID`** — the prod `Organization.id` of HAW Kiel, the target
   of the mandate restriction. It is *not* 8 (that was staging):
   ```graphql
   query { Organization(where: {name: {_ilike: "%HAW%Kiel%"}}) { id name } }
   ```
7. **Migration VM** in the production project: a throwaway Debian VM whose
   attached service account has `secretAccessor` on `hasura-graphql-admin-key`
   and `keycloak-pw`, and `objectAdmin` on the production uploads bucket. Check
   SSH to the Strato server works and that there is disk for the rsync of
   `public/system` (logos + job PDFs).
8. **Decide the job-alert timing.** The ETL imports the Rails "Job-Letter"
   settings as **active** `JobAlertSubscription` rows, and `send_job_alerts`
   runs Mondays 06:00 UTC. Either send the "the platform moved" mail to students
   before that Monday, or pause the cron until you have.
9. **Agree the freeze window** and prepare the communication: employers (their
   password still works — the bcrypt hashes are imported — and where to find
   "Mein StuJo"), students, and the maintenance banner text for the Rails app.

---

## 3. Phase A — data migration (production ETL)

Runner: **`scripts/stujo_migrate_prod.sh`**, a thin wrapper over
`stujo_migrate_gcp.sh` that sets the production endpoints and refuses to run
without the prod-specific values and an explicit `PROD` confirmation.

Prerequisite: the release carrying the StuJo schema is **on production**
(promoting is what applies the migrations and the `JobPortalDomain` seed the
redirects depend on) and the app answers on `stujo.opencampus.sh`.

```bash
# on the VM, in the production project.
# Read the SSH password from a prompt rather than typing it into the command
# line: an exported literal lands in the shell history of a machine that still
# has to survive until the delta run.
read -rs -p 'StuJo SSH password: ' STRATO_SSH_PASS && export STRATO_SSH_PASS && echo
export GCP_PROJECT=<prod-project> GCS_BUCKET=<prod-bucket> HAW_ORG_ID=<id>

# 1. dry run — validates source connectivity and previews the filtered scope
DRY_RUN=1 bash stujo_migrate_prod.sh 2>&1 | tee prod-dryrun.log

# 2. full run
STUJO_PROD_CONFIRM=PROD bash stujo_migrate_prod.sh 2>&1 | tee prod-migrate.log
```

Then **verify** against production Hasura before touching DNS:

```graphql
query CutoverCounts {
  organizations: Organization_aggregate(where: {aliases: {_has_key: "stujo"}}) { aggregate { count } }
  jobAdmins: OrganizationAdmin_aggregate(where: {canManageJobs: {_eq: true}}) { aggregate { count } }
  published: JobPosting_aggregate(where: {status: {_eq: PUBLISHED}}) { aggregate { count } }
  archived: JobPosting_aggregate(where: {status: {_eq: ARCHIVED}}) { aggregate { count } }
  credits: JobPostingCredit_aggregate { aggregate { count sum { remaining } } }
  alerts: JobAlertSubscription_aggregate(where: {active: {_eq: true}}) { aggregate { count } }
}
```

Expected orders of magnitude from the source audit (plan §9): ~2,480
organizations, 733 organizations with credits, ~1,000 published postings, 322
students. Also spot-check, because counts do not catch these:

- the file-copy summary at the end of the log (`logos missing` / `pdfs missing`
  must be 0 — re-run backfills them);
- a handful of logos and job PDFs actually load from the bucket;
- one employer with an imported bcrypt hash can log in on
  `stujo.opencampus.sh` with their **old** password;
- an org-admin grant reached Keycloak: the `add_keycloak_org_admin_role` event
  trigger fires once per `OrganizationAdmin` insert, so watch the event queue
  and the function's error rate during the run — a few thousand events arrive
  in a burst.

Then, in the window:

1. **Freeze writes on Rails** (maintenance banner, employer login disabled).
2. **Delta run:** repeat step 2 above. The upsert reconciles edits, re-posts,
   status changes and credit balances since the full run — not just new rows.
3. **Tear down the VM** (it holds the SSH password and the logs).

The ETL is idempotent, so a delta run is also the recovery path if something in
the full run needs correcting.

---

## 4. Phase B — domain cutover

### Step 1 — stand up stujo.net (does not move any traffic yet)

1. In the production workspace set `cloudflare_zone_id_stujo` and
   `stujo_net_enabled = true` (plus `stujo_net_redirect_hostnames` if the
   `en.*` hosts are in use).
2. **Delete the old web A/CNAME records** for those hosts in the Cloudflare
   dashboard (group 1 from §2.1). Terraform does not adopt existing records: if
   the old ones stay, Cloudflare answers with both addresses in turn and half
   the traffic keeps landing on Rails. Leave MX/TXT alone.
3. `terraform apply`. This creates the IP, the records, the certificate, one
   backend per portal and the URL map. The Cloud Run services get a new
   revision (a `STUJO_CANONICAL_REDIRECTS=false` env var) — no behaviour change.
4. **Wait for the certificate to be ACTIVE.** DNS has to resolve first, so this
   takes minutes to tens of minutes:
   ```bash
   gcloud compute ssl-certificates list --global --project <prod>
   gcloud compute ssl-certificates describe stujo-net-cert-<suffix> --global \
     --project <prod> --format='yaml(managed.status, managed.domainStatus)'
   ```
   Every domain must show `ACTIVE`. A domain stuck in `FAILED_NOT_VISIBLE` means
   its record is missing, still points elsewhere, or is Cloudflare-**proxied**
   (the records must stay DNS-only, or validation can never succeed).
5. **Smoke-test every host over HTTPS** while the old site is still reachable:
   ```bash
   for h in stujo.net www.stujo.net cau.stujo.net haw-kiel.stujo.net \
            fh-kiel.stujo.net flensburg.stujo.net; do
     echo "== $h"; curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://$h/"
     curl -sS "https://$h/" | grep -o '<title>[^<]*</title>'   # portal branding
   done
   curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://stujo.net/   # → 301 https
   ```
   Check a legacy job URL resolves through the ETL mapping:
   `https://stujo.net/stellenangebote/<old-rails-id>-<slug>` → 301 →
   `/stellenangebote/<new-id>`.

At this point stujo.net serves the new app and Rails is only reachable by IP.
`*.opencampus.sh` still works unchanged, and rollback is still one DNS change.

### Step 2 — make stujo.net canonical

1. Set `stujo_net_canonical = true` and apply. This rolls new revisions with
   `NEXTAUTH_URL` on the stujo.net hosts, `STUJO_FRONTEND_URL` (mail links,
   Stripe return URLs) on the cloud functions, and turns the
   `*.opencampus.sh → stujo.net` 301s on.
2. Set the production GitHub Actions variable
   `NEXT_PUBLIC_STUJO_URL=https://stujo.net` and re-run the production build, so
   edu-hub's job tiles link to the canonical domain. (This one is inlined at
   build time; the Cloud Run env var alone does not reach the browser.)
3. Verify:
   - login on `stujo.net` completes and lands back on stujo.net (this is what
     the Keycloak redirect URIs from §2.4 are for);
   - `https://stujo.opencampus.sh/` → 301 → `https://stujo.net/`, and the same
     per portal host;
   - `https://en.stujo.net/stellenangebote` → 301 → `https://stujo.net/en/stellenangebote`
     (only if those hosts were listed in §2.1);
   - a job posting checkout returns to `stujo.net/mein-stujo` and the
     confirmation mail's links point at stujo.net;
   - an EduHub job tile links to `stujo.net`.

### Rollback

| Situation | Action |
|---|---|
| Certificate will not validate | Nothing has moved yet — fix the record, or set `stujo_net_enabled = false` and re-apply. |
| stujo.net serves but is broken | Point the stujo.net records back at the Strato server (TTL is 60s) and lift the Rails freeze. The GCP-side resources are additive and can stay. |
| Only the canonical switch is wrong | `stujo_net_canonical = false` + apply: the 301s stop and the URLs revert, while stujo.net keeps serving. |

---

## 5. Phase 4 — after the cutover

1. Keep Rails reachable read-only for the agreed period, then archive the MySQL
   dump and `public/system` (the payment history stays there — invoices are
   deliberately not imported) and decommission the server.
2. Send the employer and student communication; then let the first
   `send_job_alerts` Monday run (or un-pause it).
3. Raise the DNS TTLs again once the move has settled.
4. Decide when to retire the interim `stujo-<portal>.opencampus.sh` services.
   They cost nothing at rest (scale to zero) and are the 301 sources for old
   links, so there is no hurry — but the redirect map in `proxy.ts` and
   `local.stujo_portals` are what to delete when you do.
5. Watch for 404s on `/arbeitgeber/:id-:slug`: those legacy employer pages have
   no counterpart in the app yet (plan §8.2). The resolver is ready in
   `lib/legacyRedirects.ts`; wiring it up is a small change once the route
   exists.

---

## 6. Open items — decisions or lookups needed before the window

- The **actual host list** in the stujo.net zone (§2.1), including whether the
  `en.*` locale hosts and `fh-kiel.stujo.net` are still in use.
- Whether `stujo.net` carries **mail** that must survive the move (§2.2).
- `HAW_ORG_ID` on production (§2.6).
- The **freeze window** and the communication texts (§2.9).
- Whether to build `/arbeitgeber` before or after the cutover (§5.5).
