# StuJo → EduHub production cutover

How the old Rails StuJo is replaced by the app in this repo, and how `stujo.net`
starts pointing at it. Two workstreams that meet only at the end:

- **A — data:** run the ETL against production (§3). Independent of DNS.
- **B — domain:** serve `stujo.net` from the new app (§4). Independent of data,
  except that the legacy job redirects can only resolve once the data is in.

Do A first and QA on the interim `*.opencampus.sh` hosts; do B in a low-traffic
window. B happens almost entirely in Cloudflare — nothing on the Google side
changes — so the switch-over is a rule, not a merge: nothing has to be held back
in review.

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
| Legacy 301s | `frontend-nx/apps/stujo/proxy.ts` | this change; the canonical redirect is off until `STUJO_CANONICAL_REDIRECTS=true` |
| Public host of the app | `var.stujo_net_canonical` (Terraform) | this change, off by default |

### How stujo.net is served

**Cloudflare serves it; we do not.** Each stujo.net host is a proxied record
with an **Origin Rule** that rewrites the origin `Host` to the matching interim
name:

| Visitor sees | Origin Host Cloudflare sends | Cloud Run service |
|---|---|---|
| `stujo.net`, `www.stujo.net` | `stujo.opencampus.sh` | `stujo` |
| `cau.stujo.net` | `stujo-cau.opencampus.sh` | `stujo-cau` |
| `haw-kiel.stujo.net`, `fh-kiel.stujo.net` | `stujo-haw-kiel.opencampus.sh` | `stujo-haw-kiel` |
| `flensburg.stujo.net` | `stujo-flensburg.opencampus.sh` | `stujo-flensburg` |

That name is exactly what the existing load balancer routes on (its
`url_mask` is `<service>.opencampus.sh`) and exactly what its certificate
already covers — a Host override in an Origin Rule sets the **SNI to the same
value**, so the origin connection still validates and the zone can stay on
**Full (strict)**. The visitor's address bar keeps saying `stujo.net`, because
Cloudflare proxies rather than redirects.

So the domain move needs **no second load balancer, no certificate change, no
new DNS record on the Google side, and no change to the URL map**. TLS at the
edge comes from the Cloudflare certificate (Advanced Certificate Manager covers
`*.stujo.net` and, for the legacy locale hosts, `*.en.stujo.net`).

The one thing the app must be told is the visitor's real host, since the Host
header no longer carries it: a Transform Rule adds `X-Original-Host`, and
`proxy.ts` builds its redirects from that. Without it a legacy job link would
be 301'd off stujo.net and onto opencampus.sh.

### The one Terraform switch

`var.stujo_net_canonical` lives in the **production** Terraform Cloud workspace
and is `false` everywhere until set (staging never sets it). On, it says *which
domain the app calls itself*: `NEXTAUTH_URL`, the mail links and Stripe return
URLs in the cloud functions, EduHub's outbound job links, and a 301 from a
**direct** hit on an interim opencampus.sh host to its stujo.net equivalent.
Requests arriving through Cloudflare carry `X-Original-Host` and are served, not
redirected — otherwise they would loop.

Turning it back off is also how the public face is handed to
`stujo.opencampus.sh` later, when that is the domain being promoted.

---

---

## 2. Phase 0 — preparation (can all be done before the window)

1. **Inventory the `stujo.net` Cloudflare zone.** Export the records and split
   them into three groups:
   - *web records to repoint* — the A/CNAME records for the Strato server
     (apex, `www`, the portal subdomains, and any `en.*` host);
   - *records that must stay untouched* — MX, SPF/DKIM/DMARC TXT, and anything
     for other services;
   - *hosts nobody uses any more* — decide explicitly to drop them, because
     every host that should keep working needs its own Origin Rule.
   Then reconcile that list with the Origin Rule table in §1 and with the
   `JobPortalDomain` seed, which resolves the branding per host.
   **Confirm the Advanced Certificate Manager certificate covers them all** —
   Universal SSL stops at one level, so `cau.en.stujo.net` needs
   `*.en.stujo.net` on the ACM certificate (or drop those hosts deliberately).
2. **Mail.** The job-board templates send from `noreply@stujo.net`
   (`publishJobPosting`, `expire_job_postings`, the claim mails). Confirm
   Mailgun's sending records for `stujo.net` exist in the *new* zone and that
   the domain still verifies — moving DNS providers is exactly when SPF/DKIM
   get lost. Send one test mail before the window.
3. **Lower the TTL** to 60s on every record from group 1 while they still point
   at Strato. Once a record is proxied its TTL stops mattering (Cloudflare
   answers with its own anycast address), so the fast rollback is turning the
   proxy off — but the low TTL is what makes *that* fast in turn.
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

Everything here happens in the Cloudflare dashboard for the **stujo.net** zone,
except the last step. Nothing on the Google side changes.

### Step 1 — rules first, still pointing nowhere

Create the rules before any record is proxied, so nothing is half-configured
when traffic arrives.

1. **Origin Rules** — one per host group, per the table in §1: *Host header
   override* → the matching `<service>.opencampus.sh` name. Leave SNI alone; the
   Host override sets it to the same value, which is what keeps the origin
   connection valid.
2. **Transform Rule → Modify Request Header → Set dynamic:**
   `X-Original-Host = http.host`. This is what lets the app keep a redirected
   visitor on stujo.net.
3. **SSL/TLS mode for the zone: Full (strict).** It holds because of the SNI
   behaviour above; if a host is ever misconfigured, strict mode fails loudly
   instead of quietly serving from the wrong origin.
4. Optional: a **Redirect Rule** for the legacy locale hosts,
   `*.en.stujo.net/*` → `https://<portal>.stujo.net/en/$2` (301). `proxy.ts`
   also handles this, so the rule is only to save an origin round-trip.

### Step 2 — repoint the hosts

Switch each web record from the Strato server to the app and turn the **proxy
on** (orange cloud). Either target works, since the Origin Rule decides the
origin Host either way:

- `CNAME → stujo.opencampus.sh`, proxied, or
- `A → <load balancer IP>`, proxied.

Leave MX and the SPF/DKIM/DMARC TXT records alone.

Smoke-test each host — the address bar must stay on stujo.net throughout:

```bash
for h in stujo.net www.stujo.net cau.stujo.net haw-kiel.stujo.net \
         fh-kiel.stujo.net flensburg.stujo.net; do
  echo "== $h"
  curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://$h/"
  curl -sS "https://$h/" | grep -o '<title>[^<]*</title>'   # portal branding
done
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://stujo.net/   # → 301 https
```

Then a legacy job URL, which must land on **stujo.net**, not opencampus.sh:
`https://stujo.net/stellenangebote/<old-rails-id>-<slug>` → 301 →
`https://stujo.net/stellenangebote/<new-id>`. If it redirects to opencampus.sh,
the `X-Original-Host` rule is not firing.

At this point stujo.net serves the new app and Rails is only reachable by IP.
`*.opencampus.sh` still works unchanged, and rollback is one toggle.

### Step 3 — make stujo.net the public face

1. Set `stujo_net_canonical = true` in the production workspace and apply. New
   revisions carry `NEXTAUTH_URL` on the stujo.net hosts, `STUJO_FRONTEND_URL`
   (mail links, Stripe return URLs) on the cloud functions, and
   `STUJO_CANONICAL_REDIRECTS=true`, which 301s a **direct** hit on an interim
   opencampus.sh host to its stujo.net equivalent.
2. Set the production GitHub Actions variable
   `NEXT_PUBLIC_STUJO_URL=https://stujo.net` and re-run the production build, so
   EduHub's job tiles link there. (This one is inlined at build time; the Cloud
   Run env var alone does not reach the browser.)
3. Verify:
   - login on `stujo.net` completes and comes back to stujo.net — this is what
     the Keycloak redirect URIs from §2.4 are for;
   - `https://stujo.opencampus.sh/` → 301 → `https://stujo.net/`, per portal
     host as well, and **no redirect loop** on stujo.net itself;
   - `https://en.stujo.net/stellenangebote` → 301 →
     `https://stujo.net/en/stellenangebote`;
   - a job posting checkout returns to `stujo.net/mein-stujo`, and the
     confirmation mail's links point at stujo.net;
   - an EduHub job tile links to stujo.net.

### Rollback

| Situation | Action |
|---|---|
| A host misbehaves | Turn its proxy off (grey cloud) and point the record back at Strato. Nothing else has changed anywhere. |
| Redirect loop or wrong host in redirects | Check the `X-Original-Host` Transform Rule; failing that, set `stujo_net_canonical = false` and apply — the 301s stop while stujo.net keeps serving. |
| The app itself is the problem | Roll back the Cloud Run revision as usual; the domain setup is independent of it. |

## 5. Phase 4 — after the cutover

1. Keep Rails reachable read-only for the agreed period, then archive the MySQL
   dump and `public/system` (the payment history stays there — invoices are
   deliberately not imported) and decommission the server.
2. Send the employer and student communication; then let the first
   `send_job_alerts` Monday run (or un-pause it).
3. Raise the DNS TTLs again once the move has settled.
4. **Do not retire the `stujo-<portal>.opencampus.sh` services.** They are no
   longer just interim aliases: they are the origin stujo.net is proxied onto,
   and they are the domain that gets promoted later. The only thing that may go
   is the 301 from them to stujo.net — that is `stujo_net_canonical`.
5. Watch for 404s on `/arbeitgeber/:id-:slug`: those legacy employer pages have
   no counterpart in the app yet (plan §8.2). The resolver is ready in
   `lib/legacyRedirects.ts`; wiring it up is a small change once the route
   exists.

---

## 6. Adding a portal on a partner's domain

A partner (a university, say) can run a white-label StuJo portal on their own
domain — `jobs.uni-x.de` — without any infrastructure of ours: no Cloud Run
service, no Terraform, no certificate on our load balancer, no deploy. It is
the same mechanism stujo.net uses (§1): Cloudflare proxies the host and rewrites
the origin `Host` to a service we already run; the app resolves the branding
from `X-Original-Host`, so which service answers does not matter.

Remember what a portal *is* (integration plan §2.4): a **branding** dimension
only. Every portal shows the same job pool. A partner domain does not get its
own jobs, its own employers or its own data — if that is what was promised,
this is the wrong mechanism.

### 1. Decide where the hostname's DNS lives

| | Partner delegates the hostname to our Cloudflare account | Partner keeps their DNS |
|---|---|---|
| What they do | Add an `NS` record for `jobs.uni-x.de` pointing at our Cloudflare nameservers (or move the zone) | `CNAME jobs.uni-x.de` → a hostname we give them |
| Certificate | Our zone, our certificate — nothing extra | Needs **Cloudflare for SaaS** (custom hostnames): the certificate is issued for *their* name at our edge, validated by DCV. An add-on — check the plan and per-hostname cost before promising a date |
| Effort | Lowest; prefer it when the partner is willing | Use when their IT will not delegate |

The rest is identical either way.

### 2. Seed the portal (the only part that is really about the portal)

Three rows, ideally as a migration so every environment gets them
(`backend/migrations`, see `1783583081555_insert_stujo_app_settings` and
`1784400000000_create_table_public_JobPortalDomain` for the shape):

| Table | What it carries |
|---|---|
| `AppSettings` | `appName`, logo, favicon, primary/secondary colour, imprint/privacy/terms URLs |
| `JobPortal` | `slug`, `title`, `contactEmail`, `defaultRegion` |
| `JobPortalDomain` | `hostname` → `appName` — **this is what maps the partner's domain to their branding** |

### 3. Three Cloudflare rules

1. **DNS:** the hostname as a **proxied** record — `CNAME → stujo.opencampus.sh`
   (or `A →` the load balancer IP).
2. **Origin Rule:** Host header override → `stujo.opencampus.sh`. Any StuJo
   service works, since branding no longer depends on which one answers; the
   root service is the obvious choice. The override sets the SNI too, so the
   origin connection stays valid on Full (strict).
3. **Transform Rule:** set request header `X-Original-Host` = `http.host`. This
   is what carries the partner's hostname to the app — without it the portal
   falls back to the origin's own branding. If the existing rule is scoped to
   the stujo.net zone, the partner's zone needs its own copy.

### 4. Verify

```bash
curl -sS https://jobs.uni-x.de/ | grep -o '<title>[^<]*</title>'   # their title
curl -sS -o /dev/null -w '%{http_code}\n' https://jobs.uni-x.de/  # 200, never 301
```

A 301 to stujo.net means the `X-Original-Host` rule is not firing: the app then
sees a bare interim host and canonicalises it.

### What a partner domain does *not* get

- **Login, mail links and Stripe return URLs stay on the canonical host**
  (stujo.net today). `NEXTAUTH_URL` is per Cloud Run service, so an employer
  signing in from the partner domain lands on ours. If a partner needs login on
  their own domain, that one *does* need a dedicated service with its own
  `NEXTAUTH_URL` — the pattern `local.stujo_portals` already implements.
- **No legacy-URL redirects.** `proxy.ts` deliberately builds redirects only for
  hosts in the stujo.net zone; a partner domain has no legacy StuJo URLs, and
  redirecting it to a host outside its own domain would be worse than serving
  the page.

---

## 7. Open items — decisions or lookups needed before the window

- The **actual host list** in the stujo.net zone (§2.1), including whether the
  `en.*` locale hosts and `fh-kiel.stujo.net` are still in use.
- Whether `stujo.net` carries **mail** that must survive the move (§2.2).
- `HAW_ORG_ID` on production (§2.6).
- The **freeze window** and the communication texts (§2.9).
- Whether to build `/arbeitgeber` before or after the cutover (§5.5).
