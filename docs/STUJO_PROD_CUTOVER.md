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

The Cloudflare side is Terraform, not dashboard clicking:
`infrastructure/application/09_stujo_net.tf` holds the records, the Origin
Rules, the `X-Original-Host` Transform Rule and the zone's SSL mode. The zone
predates it and is adopted by import rather than rebuilt — §4.1.

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

   **c. SPF: EDIT the existing record. Do not add a second one.** This is not
   a hypothetical here — the zone already publishes SPF, because **stujo.net is
   a live Microsoft 365 mail domain**: it has `autodiscover.stujo.net →
   autodiscover.outlook.com` and the `selector1`/`selector2._domainkey` CNAMEs
   that are M365's DKIM. A domain may publish exactly one SPF TXT record; two
   is a `permerror` and every receiver treats the result as unauthenticated —
   so adding Mailgun's include as a new record would break the mail that
   already works, not just the mail you are adding.

   Take the existing record, insert Mailgun's `include:` before the trailing
   `all` mechanism, and leave everything else alone:

   ```
   before: v=spf1 include:spf.protection.outlook.com -all
   after:  v=spf1 include:spf.protection.outlook.com include:<mailgun>.mailgun.org -all
   ```

   (Copy Mailgun's exact include from its panel; the EU region's differs.)
   Watch the ten-DNS-lookup SPF limit: two `include:`s is well inside it, but
   it is the reason not to keep piling them on.

   **c2. DKIM will not collide, and M365 is why to check.** M365 owns
   `selector1` and `selector2`; Mailgun publishes under its own selector, so
   the two coexist. Confirm the selector Mailgun gives you is neither of those
   before adding it.

   **d. The tracking CNAME must be DNS-only (grey cloud).** Cloudflare proxies
   a CNAME by default, which answers with Cloudflare's own addresses and
   breaks Mailgun's tracking and bounce endpoints. Toggle the cloud icon to
   grey on `email.stujo.net`. The TXT records cannot be proxied, so they need
   no such care.

   **e. Do NOT add Mailgun's MX records.** Those hand *inbound* mail for
   `stujo.net` to Mailgun — and stujo.net's inbound mail already belongs to
   Microsoft 365. Adding them would take delivery away from the tenant that
   holds the mailboxes. Sending verification needs the two TXT records, not the
   MX; leave the MX exactly as it is.

   The upside of the zone already being on M365: **`team@stujo.net` may exist
   already, or is one mailbox/alias away in the M365 admin centre** rather than
   a new mail setup. Check before building anything — it is the last thing
   §2.2 needs, and these mails invite replies.

   **f. DMARC.** A domain sending through M365 usually already has
   `_dmarc.stujo.net`; check the inventory. If it does, leave the policy alone
   — adding Mailgun as a second authorised sender does not require loosening
   it, because the apex signs as `d=stujo.net` for a `From` on `stujo.net` and
   so aligns under strict and relaxed alike. If it does not, add one at
   `p=none` with a `rua=` address and read the reports before enforcing.

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

3. **TTLs — largely already handled.** The web hosts are **already proxied**,
   so their public answer is Cloudflare's anycast address and their TTL is
   irrelevant: repointing them changes only the origin behind the proxy, which
   takes effect at once and is invisible to resolver caches. There is no DNS
   propagation step in this cutover and no window to wait out.

   That leaves TTLs to think about only for records you might switch to
   **DNS-only** in a rollback, and for the mail records if they are ever
   touched. If a host is unproxied today and you intend to proxy it (the `en.*`
   locale hosts, §4.6), lower its TTL first — that one *does* propagate.
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

The stujo.net zone is **managed by Terraform**, in
`infrastructure/application/09_stujo_net.tf`: the proxied records, the Origin
Rules that rewrite the origin `Host`, the Transform Rule that passes
`X-Original-Host`, and the zone's SSL mode. Nothing on the Google side changes.

### 4.1 The zone already exists — adopt it, do not rebuild it

The zone predates Terraform and its records point at the old platform —
**already proxied**, at a single Strato address. That last detail is the best
news in this plan: the visitor-facing DNS answer is Cloudflare's anycast
address today and stays Cloudflare's anycast address afterwards. Nothing
propagates, nothing is cached against you, and the change is confined to which
origin Cloudflare talks to.

Three facts shape everything below:

- **Terraform is not authoritative over a Cloudflare zone.** It knows only what
  is declared. Applying `09_stujo_net.tf` cannot delete, touch or even notice a
  record it does not declare, so there is no risk of it quietly removing the
  zone's mail records. The flip side is that nothing is cleaned up for you
  either.
- **A record that is imported and then changed never stops resolving.** One
  that is deleted and recreated leaves a gap in which the name does not exist,
  and NXDOMAIN is negatively cached. This is the whole reason to import rather
  than recreate — and the reason `09_stujo_net.tf` keeps the web hosts as **A
  records pointing at the load balancer IP** instead of turning them into
  CNAMEs: changing a record's *type* can force a destroy-and-create, which is
  exactly the gap importing exists to avoid. The Origin Rule decides the origin
  Host either way, so the record type buys nothing.
- **The zone is a live Microsoft 365 mail domain.** `autodiscover`, the
  `selector1`/`selector2._domainkey` CNAMEs, the MX and the SPF record all
  belong to mail that works today and must keep working. None of them is
  declared in `09_stujo_net.tf`, so no apply can touch them — but see §2.2 for
  the one that must be *edited by hand* when Mailgun is added.

So the question is not "delete or import?" but "which of these records should
Terraform own?", answered per record. Get the list first:

```bash
CF_API_EMAIL="$CLOUDFLARE_EMAIL" CF_API_KEY="$CLOUDFLARE_API_KEY" \
  ./scripts/cloudflare_zone_inventory.sh stujo.net
```

It writes `stujo.net-records.tsv` (the §2.1 inventory) and
`stujo.net-import.tf` (import blocks for exactly the hosts
`09_stujo_net.tf` declares). It is read-only; it never writes to Cloudflare.
The Global API key the provider already uses works, since it is account-wide —
no new credential, as long as stujo.net sits in the same Cloudflare account.

### 4.2 Sort every record into one of four buckets

| Bucket | Records seen in the zone | What to do |
|---|---|---|
| **Repoint** | `stujo.net`, `cau`, `haw-kiel`, `flensburg` (A, proxied) and `www` (CNAME → apex, proxied) | **Import.** Declared in `09_stujo_net.tf`; importing makes the cutover an in-place `value` change. `www` needs no change at all — it follows the apex — but is declared so Terraform owns it. |
| **Leave to Microsoft 365** | `MX`, the SPF `TXT`, `selector1`/`selector2._domainkey`, `autodiscover` | **Do not import, do not declare.** This is working mail. Terraform cannot touch what it does not declare, so leaving them out is the *safe* option, not the lazy one. The one exception is the SPF record, which must be **edited by hand** to add Mailgun's include (§2.2 c) — editing it in the dashboard and leaving it unmanaged is fine and is what this plan assumes. |
| **Legacy `en.*`** | `haw-kiel.en.stujo.net` (A, **DNS-only**) and any siblings | **Decide — see §4.6.** They point at Strato and are not proxied, so after the cutover they resolve to a dead server. Doing nothing is the one option that is actually wrong. |
| **Unexplained** | anything nobody recognises | **Leave alone** until somebody can say what it is for. Adopting a record you cannot explain is how a zone loses one it needed. |

The generator emits blocks only for the first row. The rest it prints as a
list, so the decision is made rather than defaulted.

The generator only emits blocks for the first bucket. The second is a decision,
so it asks you to make it rather than making it for you.

### 4.3 Import via `import` blocks, not the CLI

State lives in Terraform Cloud, and `required_version = "~> 1.3"` permits
Terraform ≥ 1.5, so use **`import` blocks** rather than `terraform import`:

- they live in the repo, so the import is reviewed like any other change;
- they run in the normal plan/apply — no local state access, no one-at-a-time
  state mutation outside review;
- **the plan is the cutover review.** It shows each adoption and then exactly
  what changes: `value: "81.x.x.x" -> "stujo.opencampus.sh"`, `proxied: false ->
  true`. Nothing happens until it is applied.

Steps:

1. Drop the generated `stujo.net-import.tf` into
   `infrastructure/application/`, read it, and commit it.
2. Set `stujo_net_zone_id` in the **production** workspace to the zone ID the
   script printed. Leave it empty everywhere else — that is what keeps the zone
   out of the staging and dev plans.
3. Plan, and read every line. Expect: imports for the web records, an in-place
   update on each of them, and creates for the two rulesets and the zone
   setting. Expect **no destroys**. A destroy in this plan means a record was
   matched wrongly — stop and work out why.
4. Apply. This is the cutover: at this moment stujo.net starts serving the app.
5. Delete `stujo.net-import.tf` in a follow-up commit. Applied import blocks are
   no-ops; leaving them is noise.

### 4.4 Before the first plan: check the provider supports the rules

`01_main.tf` pins `cloudflare/cloudflare ~> 3.0` and no lockfile is committed.
Origin Rules and Transform Rules are `cloudflare_ruleset` resources with the
`http_request_origin` and `http_request_late_transform` phases, and **whether
the resolved 3.x supports those phases needs checking before you rely on
`09_stujo_net.tf`** — it was written from the documented schema but could not
be validated (this repo's plans cannot reach the provider registry from every
environment). A `terraform plan` with `stujo_net_zone_id` set is the cheap
check: a schema mismatch fails at plan time, before anything is applied.

If the pinned version cannot express them, the choices are, in order of
preference:

1. **Create the two rulesets by hand in the dashboard and import them later.**
   Keeps the cutover on schedule and the provider version out of it.
2. Raise the provider version. Note this is not a small change: v4 and v5 both
   carry breaking changes, and v5 renames `cloudflare_record` to
   `cloudflare_dns_record` — which touches every record in
   `02_network.tf`, i.e. the opencampus.sh zone that is currently serving
   production. **Do not bundle a provider major upgrade into this cutover.**

### 4.5 One thing not to carry across

`02_network.tf` warns, correctly and loudly, that every record in the
**opencampus.sh** zone must stay DNS-only: those hosts are on the Google-managed
multi-SAN certificate, and a single proxied record breaks validation for the
whole certificate. The stujo.net records are the opposite — `proxied = true`,
because the proxy *is* the mechanism.

There is no conflict: these are different zones, and no stujo.net host is on
that certificate. But the two rules must not be swapped by someone tidying up
later. Never proxy an opencampus.sh record; never unproxy a stujo.net one.

### 4.6 The legacy `en.*` hosts — a decision, not an optional extra

They exist: `haw-kiel.en.stujo.net` is in the zone, as an **unproxied** A
record pointing at Strato. Whatever siblings the inventory turns up
(`en.stujo.net`, `cau.en…`, `flensburg.en…`) will be the same shape. Unproxied
means Cloudflare passes nothing through, so after the cutover they resolve to a
server that is gone. Doing nothing is the only option that is definitely wrong.

Three options:

1. **Serve them.** Proxy them and add them to `local.stujo_net_origin_hosts`;
   `proxy.ts` then 301s `<portal>.en.stujo.net/x` → `<portal>.stujo.net/en/x`
   and the old English URLs keep working. **Cost:** these are *third-level*
   hosts, and Universal SSL stops at one level — the ACM certificate must cover
   `*.en.stujo.net` or Cloudflare cannot terminate TLS for them (§2.1). Also
   lower their TTL first: unlike the apex hosts, these are unproxied today, so
   this change really does propagate.
2. **Redirect at the edge.** A Cloudflare Redirect Rule instead of the origin
   round-trip. Same ACM requirement — a Redirect Rule only runs on proxied
   traffic — so it saves a hop, not the certificate.
3. **Let them go.** Delete the records. Old English deep links break. Defensible
   if the analytics say nobody uses them; check before assuming.

Option 1 is the default if `*.en.stujo.net` is already on the ACM certificate,
since it costs nothing further. If it is not, the question is whether these
URLs are worth a certificate change during a cutover window — usually not, in
which case do option 3 now and option 1 later if anyone complains.

### 4.7 Verify, immediately after the apply

The apply in §4.3 *is* the repoint: each web record becomes a proxied CNAME to
its origin, and the two rulesets start acting on it. Mail records are untouched
— they were never in the plan.

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

### 4.8 Make stujo.net the public face

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

### 4.9 Rollback

| Situation | Action |
|---|---|
| A host misbehaves | Point the record back at `81.169.132.172` (the Strato address it holds today). Leave the proxy **on** — it was on before this cutover, so turning it off is a second change, not a rollback. The origin swaps back at once, with nothing to propagate. Terraform will show the drift on the next plan; reconcile it deliberately rather than letting an apply silently undo an emergency fix. The reviewed form of the same rollback is to revert the value in `09_stujo_net.tf` and apply. |
| Redirect loop or wrong host in redirects | Check the `X-Original-Host` ruleset is present and firing; failing that, set `stujo_net_canonical = false` and apply — the 301s stop while stujo.net keeps serving. |
| TLS errors right after the apply | Check the zone's SSL mode. The `strict` setting applies in the same change as the repoint; if it was on Flexible for the Strato origin, and something about the new origin is off, strict is what surfaces it. Do not "fix" it by dropping to Flexible — that would have Cloudflare talk plaintext to the origin. Fix the Origin Rule instead. |
| The app itself is the problem | Roll back the Cloud Run revision as usual; the domain setup is independent of it. |

A dashboard rollback beats a correct one during an incident. But write down
what you changed: the next `terraform apply` will otherwise put it back.

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

- The **complete host list** in the stujo.net zone (§2.1). A partial dashboard
  view showed `stujo.net`, `www`, `haw-kiel`, `flensburg` (all proxied),
  `haw-kiel.en` (DNS-only) and the M365 mail records — but not the whole zone.
  `scripts/cloudflare_zone_inventory.sh stujo.net` produces the full list, and
  the same run produces the Terraform import blocks (§4.1). Two specific
  questions it answers: whether `cau.stujo.net` and `fh-kiel.stujo.net` exist
  (`fh-kiel` is in the §1 table and in `local.stujo_net_a_records`; if it is
  not in the zone, Terraform will create it — trim the list if that is wrong),
  and which other `en.*` hosts there are.
- Whether the pinned `cloudflare ~> 3.0` provider can express Origin Rules and
  Transform Rules (§4.4) — a plan answers it, and the fallback is to create
  those two rules by hand and import them later.
- ~~Whether `stujo.net` carries existing mail~~ — **answered: yes, Microsoft
  365** (§2.2). What remains is whether `team@stujo.net` already exists as a
  mailbox or alias in that tenant, and the by-hand SPF edit.
- Whether the `*.en.stujo.net` hosts are worth keeping, and whether the ACM
  certificate already covers them (§4.6).
- `HAW_ORG_ID` on production (§2.6).
- The **freeze window** and the communication texts (§2.9).
- Whether to build `/arbeitgeber` before or after the cutover (§5.5).
