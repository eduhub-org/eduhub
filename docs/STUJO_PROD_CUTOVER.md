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
2. **Mail — verify `stujo.net` in Mailgun, or StuJo mail keeps leaving under
   opencampus.sh.** The code side is done: `sendMail` now sends each mail as
   the sender its template carries, through the Mailgun domain that can sign
   for it, and the StuJo templates send as **`team@stujo.net`** — a real
   mailbox, because the organization-access mail asks people to reply to it.

   What remains is the Mailgun and DNS half, and it belongs in this window
   because the records go in the zone being re-pointed. **Verify the apex
   `stujo.net`. A subdomain will not work** — `sendMail` matches a sender
   against the configured Mailgun domains **exactly**, so `mg.stujo.net` would
   not be accepted for a `team@stujo.net` sender and those mails would keep
   falling back to the opencampus.sh domain.

   That rule is deliberately strict, and the reason is this deployment's own
   `mailgun_domain`: **`edu.opencampus.sh`**, which is a *subdomain* of the
   `opencampus.sh` that every existing mail template sends as. A rule that also
   accepted a configured subdomain of the sender's domain would therefore have
   changed the visible `From` on **every EduHub mail** from
   `noreply@edu.opencampus.sh` to `noreply@opencampus.sh` — and left it
   dependent on `opencampus.sh` publishing relaxed DMARC alignment. Exact
   matching keeps every existing mail exactly as it is and changes only the
   domains actually configured for. It also means `d=` always equals the `From`
   domain, so StuJo mail aligns under strict alignment as well as relaxed,
   whatever the stujo.net zone publishes now or grows into later.

   **a. Add the domain in Mailgun — in the EU region.** This account sends
   through `https://api.eu.mailgun.net` (`functions/sendMail/index.js`), so the
   domain must be created in the **EU** region, not US. The two regions are
   separate namespaces with different DNS values; a domain verified in the
   wrong one is invisible to the API key in use and every send fails with a
   404-shaped "domain not found". Switch the region in the Mailgun control
   panel before *Add New Domain*, enter `stujo.net`, and leave DKIM at the
   default key length unless the zone has a reason otherwise.

   **b. Copy the records Mailgun then shows** — do not copy them from this
   document. They are per-domain and per-region, and the DKIM value in
   particular is unique to your domain. Mailgun lists four kinds:

   | Record | Type | Purpose | Add it? |
   |---|---|---|---|
   | SPF on `stujo.net` | TXT | authorises Mailgun's senders | **yes — but merge, see c** |
   | `<selector>._domainkey.stujo.net` | TXT | the DKIM public key | **yes** |
   | `email.stujo.net` | CNAME | open/click tracking + bounce handling | **yes — DNS-only, see d** |
   | `stujo.net` MX ×2 | MX | receiving mail *at Mailgun* | **no — see e** |

   **c. SPF: merge, never add a second record.** A domain may publish exactly
   one SPF TXT record; two is a `permerror` and every receiver treats the
   result as unauthenticated. If `stujo.net` already has an SPF record (check
   the zone export from step 1), add Mailgun's `include:` into the existing
   record rather than creating another, keeping the single trailing `all`
   mechanism at the end.

   **d. The tracking CNAME must be DNS-only (grey cloud).** Cloudflare proxies
   a CNAME by default, which answers with Cloudflare's own addresses and
   breaks Mailgun's tracking and bounce endpoints. Toggle the cloud icon to
   grey on `email.stujo.net`. The TXT records cannot be proxied, so they need
   no such care.

   **e. Do NOT add Mailgun's MX records.** Those hand *inbound* mail for
   `stujo.net` to Mailgun. `team@stujo.net` has to arrive in a mailbox a person
   reads — these mails invite replies — so the zone's MX must point at whatever
   hosts that mailbox. This is the one cost of choosing the apex over
   `mg.stujo.net`, and it is only a cost if you forget: sending verification
   needs the two TXT records, not the MX. Decide where `team@stujo.net` is
   hosted, and carry its MX (and its own SPF include, per c) into the
   Cloudflare zone with everything else in step 1.

   **f. DMARC.** If the zone has no `_dmarc.stujo.net` record, add one — start
   at `p=none` with a `rua=` address so you see the reports before enforcing
   anything. Its `adkim`/`aspf` tags do not constrain the choice above: the
   apex signs as `d=stujo.net` for a `From` on `stujo.net`, which aligns under
   strict and relaxed alike.

   **g. Set `mailgun_additional_domains = ["stujo.net"]`** in the Terraform
   workspace and apply.

   **h. Verify with a real message, not with the panel.** Mailgun's green tick
   says the records parse, not that mail aligns. Trigger one StuJo mail (a job
   posting publish on a test organization does it) and read the
   `Authentication-Results` header on what arrives:

   ```
   dkim=pass header.d=stujo.net
   spf=pass smtp.mailfrom=...stujo.net
   dmarc=pass
   ```

   A `d=` of anything but `stujo.net`, or the mail arriving from
   `noreply@edu.opencampus.sh`, means the switch did not take — check the
   function logs for the `Sender not covered by a configured Mailgun domain`
   line, which names the address it wanted. That line is logged once per
   distinct sender per instance, not once per mail, so expect to see it for
   `noreply@opencampus.sh` regardless: those templates name a domain this
   deployment does not send through, which is the pre-existing state, not a
   fault.

   Until step g, nothing changes at all: a sender no configured domain covers
   falls back to `noreply@${MAILGUN_DOMAIN}`, which is exactly what every mail
   sends as today. The order is therefore free — deploy first and verify later,
   or the other way round — and merging the code on its own is a no-op for
   mail.

3. **Lower the TTL** to 60s on every record from group 1 while they still point
   at Strato. Once a record is proxied its TTL stops mattering (Cloudflare
   answers with its own anycast address), so the fast rollback is turning the
   proxy off — but the low TTL is what makes *that* fast in turn.
4. **Keycloak — production realm `edu-hub`, client `hasura`.** Without this,
   login on the new domain fails at the callback, and it is the one step no
   Terraform in this repo performs. All four StuJo portals use the *same*
   client (`clientId: 'hasura'` in the shared NextAuth config); there is no
   per-portal client, so everything below goes on that one client.

   The values follow from `NEXTAUTH_URL`, which Terraform sets per service from
   `stujo_net_canonical_hosts` once `stujo_net_canonical` is on:

   | Service | `NEXTAUTH_URL` after the switch |
   |---|---|
   | `stujo` | `https://stujo.net` |
   | `stujo-cau` | `https://cau.stujo.net` |
   | `stujo-haw-kiel` | `https://haw-kiel.stujo.net` |
   | `stujo-flensburg` | `https://flensburg.stujo.net` |

   **Valid redirect URIs** — NextAuth builds its callback as
   `<NEXTAUTH_URL>/api/auth/callback/keycloak`, so add:

   ```
   https://stujo.net/api/auth/callback/keycloak
   https://cau.stujo.net/api/auth/callback/keycloak
   https://haw-kiel.stujo.net/api/auth/callback/keycloak
   https://flensburg.stujo.net/api/auth/callback/keycloak
   ```

   The existing entries use the broader `https://<host>/*` shape. Either works;
   the exact paths are the tighter choice, since a redirect URI is what an
   attacker abuses if a client is ever tricked into an open redirect. **Keep
   the existing `*.opencampus.sh` entries** — those hosts stay reachable and
   are what you QA on before flipping the switch, and what you fall back to.

   **Valid post logout redirect URIs** — `pages/api/auth/logout.ts` passes
   `NEXTAUTH_URL` *verbatim* as `post_logout_redirect_uri`, so these are bare
   origins with no path and no wildcard:

   ```
   https://stujo.net
   https://cau.stujo.net
   https://haw-kiel.stujo.net
   https://flensburg.stujo.net
   ```

   If your Keycloak version has no separate field for this, it validates the
   post-logout URI against the redirect URIs instead — in which case the `/*`
   shape above already covers it, but the exact-path shape does not. A `+` in
   this field means "reuse the redirect URIs".

   **Web origins** — add the same four origins. The login code exchange and the
   token refresh both run server-side (`/api/auth/*`), so CORS is not on the
   critical path and these are belt-and-braces rather than required; they cost
   nothing and match how the existing hosts are configured.

   **One thing to know about `www`.** `www.stujo.net` is served (§1), but it is
   not a `NEXTAUTH_URL`, so a visitor who logs in there is returned to
   `stujo.net` — the session works, the host just changes under them. If that
   bothers you, add a Cloudflare **Redirect Rule** `www.stujo.net/*` →
   `https://stujo.net/$1` (301) and drop `www` from the Origin Rule table, so
   there is one origin rather than two. Do not add `www` to `NEXTAUTH_URL`
   instead: two hosts issuing cookies for the same app is the thing that
   actually breaks sessions.
5. **Stripe (live):** job posting prices + tax rate bootstrapped
   (`createStripeJobPostingPrices`), webhook endpoint subscribed to
   `checkout.session.completed` **and** `invoice.finalized`, and the workspace
   variables `stujo_admin_email`, `stujo_seller_organization_id`,
   `stripe_tax_rate_id` set as intended.

   `stujo_admin_email` carries more than Stripe: it is also the fallback
   contact address the organization-claim and access-request mails print, via
   `resolveContactEmail`. All four `JobPortal` rows currently have
   `contactEmail` NULL, so every portal falls back to it — and if it is unset
   too, `resolveContactEmail` returns null and those mails are skipped rather
   than sent with a blank address. Set it, or give each portal its own
   `JobPortal.contactEmail`.
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
10. **Announce the window to the employers who have posted.** See §2.10 below —
    it is the one piece of the communication with a mechanism rather than just
    a text.

### 2.10 Telling the employers — send it through the platform

**Recommendation: send it from the new platform, not from Outlook.** Not
because Outlook cannot do it, but because of four things it does badly at this
size:

- **One mail per recipient, by construction.** A BCC list is one mis-click from
  disclosing every employer's address to every other employer — a personal-data
  breach that is reportable under GDPR Art. 33, over an announcement. Rows in
  `MailLog` cannot make that mistake: each is addressed to one person.
- **Authenticated sending.** Once §2.2 is done these leave as `team@stujo.net`
  through Mailgun with SPF and DKIM. A few hundred BCC recipients from a
  personal mailbox is the exact shape spam filters bury — and this is the one
  mail you cannot afford to have filtered.
- **You learn who you failed to reach.** Mailgun logs the bounces, so the
  employers whose address died with the old platform become a list you can act
  on, rather than silence. Those are precisely the people who would otherwise
  be surprised.
- **It is on the record.** `MailLog` answers "did we tell them, and when?"
  months later.

It also rehearses the mail path end to end on real recipients before the
cutover depends on it.

**When:** after the full ETL run (the addresses only exist in the new database
afterwards) and after §2.2 step g (or it goes out as `noreply@opencampus.sh`),
and before the freeze — that is the whole point of it.

**a. See who it would reach**, before writing anything:

```graphql
query CutoverRecipients {
  OrganizationAdmin(
    where: {
      canManageJobs: { _eq: true }
      Organization: { JobPostings: {} }
    }
  ) {
    User { id email firstName lastName }
    Organization { id name }
  }
}
```

`Organization: { JobPostings: {} }` means "has at least one job posting in any
status" — an employer whose posting has long expired still had an account here
and still needs telling. Check the count against what you expect from Rails
before going further, and de-duplicate: one person may administer several
organizations and must not get the mail several times.

**b. Send yourself one first.** Insert a single `MailLog` row addressed to you,
confirm it arrives, renders, and comes from `team@stujo.net`. The content is
HTML — the templates in this repo use plain `<p>` and `<a>`; the admin editor's
DOMPurify configuration strips `<table>`, so do not build a layout out of one.

**c. Then insert one row per recipient.** The `send_mail` event trigger fires
per row, so the insert *is* the send:

```sql
INSERT INTO "public"."MailLog" ("subject", "content", "from", "to", "status", "metadata")
SELECT DISTINCT ON (u."email")
  'StuJo zieht um: was sich für Dich ändert',
  '<p>Hallo,</p><p>…</p>',
  'team@stujo.net',
  u."email",
  'READY_TO_SEND',
  '{"announcement": "stujo-cutover"}'::jsonb
FROM "public"."OrganizationAdmin" oa
JOIN "public"."User" u ON u."id" = oa."userId"
WHERE oa."canManageJobs"
  AND EXISTS (SELECT 1 FROM "public"."JobPosting" jp WHERE jp."organizationId" = oa."organizationId")
  AND NOT EXISTS (
    SELECT 1 FROM "public"."MailLog" m
    WHERE m."to" = u."email" AND m."metadata" @> '{"announcement": "stujo-cutover"}'::jsonb
  );
```

Three things that matter in that statement:

- `DISTINCT ON (u."email")` and the `NOT EXISTS` guard are what make it safe to
  run twice — the second run inserts nothing. Run it in a transaction and check
  the row count before committing.
- The `metadata` key is `announcement`, deliberately **not** `jobPostingId`:
  the partial unique index `MailLog_job_posting_mail_unique` constrains rows
  carrying that key and would reject the batch.
- Send in batches (add a `LIMIT`) if the list runs to thousands, so a mistake
  in the text costs one batch rather than all of them.

**d. Read the result.** Count the rows, then check Mailgun's log for bounces
after an hour. Nothing in this repo retries a hard bounce; those addresses are
a manual follow-up.

**Content, briefly:** these people are being told about a service they use, not
marketed to, so no consent question arises — but say plainly who is writing,
what changes and when, that their existing password still works, where "Mein
StuJo" now is, and give `team@stujo.net` as a reply address that a person
actually reads (§2.2 e).

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
- Whether `stujo.net` carries **existing mail** that must survive the move
  (§2.2), and a mailbox for `team@stujo.net` that someone reads — these mails
  invite replies.
- `HAW_ORG_ID` on production (§2.6).
- The **freeze window** and the communication texts (§2.9).
- Whether to build `/arbeitgeber` before or after the cutover (§5.5).
