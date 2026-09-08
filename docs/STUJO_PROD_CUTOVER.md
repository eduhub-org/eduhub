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
edge comes from Cloudflare's **free Universal SSL**, which covers `stujo.net`
and one level of subdomain — and every host being served is apex or one level,
so no certificate has to be bought or provisioned for this cutover. (The zone
has no Advanced Certificate Manager: it is on the Free plan, with zero SNI
custom certificates. That matters only for the third-level `*.en.stujo.net`
legacy hosts — §4.6.)

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

1. **The `stujo.net` zone — 18 records, all of them known.** The zone was read
   in full; `scripts/cloudflare_zone_inventory.sh stujo.net` reproduces this
   and generates the Terraform import blocks (§4.1).

   | Records | Proxy | Disposition |
   |---|---|---|
   | `stujo.net`, `en.stujo.net`, `cau`, `fh-kiel`, `flensburg`, `haw-kiel` (A → `81.169.132.172`) | **Proxied** | **Repoint.** Managed in `09_stujo_net.tf`, imported, value changed to the load balancer IP. |
   | `www.stujo.net` (CNAME → apex) | **Proxied** | Managed but unchanged — it follows the apex. |
   | `cau.en`, `fh-kiel.en`, `flensburg.en`, `haw-kiel.en` (A → `81.169.132.172`) | DNS only | **Leave during the window; decide at decommission (§4.6).** Universal SSL cannot reach the third level and the zone has no ACM, so they cannot be proxied as things stand. |
   | `stujo.net` MX → `stujo-net.mail.protection.outlook.com` | DNS only | **Leave.** Live Microsoft 365 mail. |
   | `stujo.net` TXT `v=spf1 include:spf.protection.outlook.co…` | DNS only | **Edit by hand** to add Mailgun (§2.2 c). Never add a second SPF record. |
   | `_dmarc.stujo.net` TXT `v=DMARC1; p=reject;` | DNS only | **Leave** — and read §2.2 f, because `p=reject` is why the Mailgun ordering is not optional. |
   | `selector1`/`selector2._domainkey` CNAMEs, `autodiscover` CNAME, `MS=ms…` TXT | DNS only | **Leave.** M365 DKIM, Autodiscover and domain verification. |

   Two things this settles. Every host in the §1 Origin Rule table exists and
   is already proxied, so that table needs no revision. And the reason the
   third-level `*.en.stujo.net` hosts are DNS-only is the certificate limit
   below — somebody already hit it.

   **The zone is on the Free plan, with no Advanced Certificate Manager**
   (SNI custom certificates: 0, IP certificates: 0 — checked). Free Universal
   SSL covers `stujo.net` and **one** level of subdomain, and that is exactly
   why `en.stujo.net` is proxied while `cau.en.stujo.net` is not.

   For the cutover this is a non-issue: every host being served is apex or one
   level, so Universal SSL already covers all of them and nothing has to be
   bought. It constrains one thing only — the four third-level
   `*.en.stujo.net` hosts, §4.6.

   Still worth seeing rather than assuming: that the Free plan's Origin Rule
   and Transform Rule allowances cover what §4 needs (four origin rules and one
   transform rule — comfortably inside the usual limits).
2. **Mail — verify `stujo.net` in Mailgun, or StuJo mail keeps leaving under
   opencampus.sh.** The code side is done: `sendMail` now sends each mail as
   the sender its template carries, through the Mailgun domain that can sign
   for it, and the StuJo templates send as **`team@stujo.net`** — a real
   mailbox, because the organization-access mail asks people to reply to it.

   What remains is the DNS half — the domain itself is already created in
   Mailgun, on the **apex `stujo.net`**, which is what `sendMail` needs. A
   subdomain would not have worked — `sendMail` matches a sender
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

   **The domain is created in Mailgun (EU region) and its records are known.**
   Everything below uses the real values. The account sends through
   `api.eu.mailgun.net`, and the MX rows Mailgun offers are
   `mxa.eu.mailgun.org` / `mxb.eu.mailgun.org`, which confirms the domain was
   created in the right region — a US-region domain would be invisible to the
   API key in use.

   **a. Add the DKIM record.** In Cloudflare, a new **TXT** record:

   | Field | Value |
   |---|---|
   | Name | `email._domainkey` |
   | Content | `k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKiUx29m4XmqBh6whaOh2fIwy1oz0UD8tCRrr6LFGfDFnjXU1rgJF6bv4bYH9tZlSBSI1IDCqiXUp5r10OWMhdGQBoEAhGKxF+OBn/BAl/VdEJYfWgD13/q+CmBcMAmluQLvTjWN/rb+B4m6slKdATVksX6PkBhrkKJrMkFTL6swIDAQAB` |
   | TTL | Auto |

   **Use Mailgun's copy button — never retype it.** The value is 225
   characters of base64 in which `0`/`O` and `l`/`I` are visually identical,
   and one wrong character means DKIM fails silently: the mail still sends, it
   just fails authentication, which under `p=reject` (f) means it is bounced.
   At 225 characters it fits in a single TXT string, so no splitting is needed.

   The selector is `email`, which does not collide with Microsoft 365's
   `selector1`/`selector2` — the two sign side by side.

   **b. EDIT the SPF record. Do not paste Mailgun's.** Mailgun shows
   `v=spf1 include:mailgun.org ~all` as if it were the whole record. Pasting
   that would drop Microsoft 365 from SPF and break the mail that already
   works. A domain may publish exactly one SPF record; two is a `permerror`
   and receivers treat the result as unauthenticated. So merge:

   ```
   before: v=spf1 include:spf.protection.outlook.com -all
   after:  v=spf1 include:spf.protection.outlook.com include:mailgun.org -all
   ```

   Keep the existing `-all`, not Mailgun's `~all`: the zone already commits to
   a hard fail and softening it would weaken every domain, not just StuJo's
   mail. Two `include:` mechanisms is far inside SPF's ten-lookup limit.

   **This edit is the single highest-risk action in the cutover.** A typo here
   fails SPF for Microsoft 365 under `p=reject`, i.e. the organisation's normal
   mail starts bouncing. Verify it the moment you save (c), and keep the exact
   original string to paste back:
   `v=spf1 include:spf.protection.outlook.com -all`

   **c. Verify the two records resolve, before touching Mailgun's button.**

   ```bash
   dig +short TXT email._domainkey.stujo.net
   dig +short TXT stujo.net
   ```

   The second must show **one** `v=spf1` line, containing both includes and
   ending `-all`, plus the untouched `"MS=ms88886274"`. If it shows two
   `v=spf1` lines, delete the one you added and edit the original instead.

   **d. Do NOT add the MX records.** Mailgun lists `mxa.eu.mailgun.org` and
   `mxb.eu.mailgun.org` under *Receiving records*, and its own note says to
   skip them if the domain already receives mail elsewhere. stujo.net receives
   through Microsoft 365 (`stujo-net.mail.protection.outlook.com`), and
   `team@stujo.net` is a live mailbox there. Adding Mailgun's MX would take
   delivery away from the tenant.

   Those two rows will therefore stay **Unverified** in Mailgun for ever. That
   is correct, not a fault, and not something to fix. Sending needs the two
   TXT records only.

   **e. The tracking CNAME — add it, DNS-only.** `functions/sendMail` sets
   `'o:tracking': true`, so Mailgun rewrites every link in a StuJo mail. With
   no tracking host of our own it rewrites them to a Mailgun-branded domain,
   which in a mail from `team@stujo.net` looks wrong and gives filters a
   sender/link mismatch to dislike. Take the host from Mailgun's *Tracking
   records* section and add it as a CNAME with the cloud icon **grey**.

   Grey matters: Cloudflare proxies a CNAME by default, which answers with
   Cloudflare's own addresses and breaks Mailgun's tracking and bounce
   endpoints. TXT records cannot be proxied, so they need no such care.

   Tracking sits at `email.stujo.net` and DKIM at
   `email._domainkey.stujo.net`. Those are separate DNS nodes and do not
   conflict: a CNAME excludes other data at *its own* owner name, not at names
   beneath it — subtree occlusion is what `DNAME` and a zone cut do, not
   `CNAME`.

   **Verify DKIM resolves anyway**, from external resolvers rather than
   whatever your laptop is using — this catches the failure that is actually
   likely, a transcription error in 225 characters of base64:

   ```bash
   dig +short TXT email._domainkey.stujo.net @1.1.1.1
   dig +short TXT email._domainkey.stujo.net @8.8.8.8
   ```

   Both must return the `k=rsa; p=…` string, byte-identical to Mailgun's.
   Nothing returned means the record is missing or misnamed, and Mailgun's
   verification will fail. **Checked 2026-09-08: both resolvers return it, and
   the key parses as a valid 1024-bit RSA SubjectPublicKeyInfo.**

   **f. DMARC is already at `p=reject` — read this before setting the
   variable.** The zone publishes `_dmarc.stujo.net = "v=DMARC1; p=reject;"`.
   That is the strictest policy there is: mail that fails DMARC for stujo.net
   is **rejected outright**, not delivered to spam. Leave the record alone —
   adding an authorised sender needs no loosening, and the apex signs as
   `d=stujo.net` for a `From` on `stujo.net`, so it aligns under the relaxed
   default and would still align under `adkim=s`.

   What it does change is that **step h is a gate, not a step.** Until it is
   taken, StuJo mail leaves as `noreply@edu.opencampus.sh` — a different
   organizational domain, entirely outside this policy. That is the safe
   state, and it is the default.

   **g. Press Verify in Mailgun and wait for both TXT rows to go green.**
   DNS is fast on Cloudflare, but Mailgun caches; if a row stays orange,
   re-check with `dig` first and only then re-press. Do not proceed while
   either sending record is unverified.

   **h. Only now set `mailgun_additional_domains = ["stujo.net"]`** in the
   production Terraform workspace and apply. The only diff is
   `MAILGUN_ADDITIONAL_DOMAINS` on the `sendMail` function — one revision, no
   other service touched.

   **i. Verify with a real message, not with the panel.** Mailgun's green tick
   says the records parse, not that mail aligns. Trigger one StuJo mail — a job
   posting publish on a test organization does it — sent to an address at a
   provider that reports DMARC (Gmail does), and read the
   `Authentication-Results` header:

   ```
   dkim=pass header.d=stujo.net
   spf=pass  smtp.mailfrom=...
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
6. **`HAW_ORG_ID = 885`** — the prod `Organization.id` of HAW Kiel (name
   `HAW Kiel`, type `UNIVERSITY`, aliases including `FH Kiel`, `kiel fh`,
   `Hochschule für Angewandte Wissenschaften Kiel`). Confirm it still holds
   before the run with the query below; it is *not* 8, which was staging.

   The ETL writes it to `JobPosting.restrictedToOrganizationId` for the ~36 jobs
   whose Rails mandate limits them to HAW students. Hasura then enforces it:
   the `anonymous` role sees only rows where that column is null, and
   `user_access` additionally sees rows restricted to the user's own
   university.

   **Why only HAW, and not the other portal universities.** Two separate
   things are easy to conflate here:
   - The **portals** (`cau`, `haw-kiel`, `flensburg`) are branding only. One
     shared job pool, resolved by hostname through `JobPortalDomain` /
     `AppSettings` — `JobPortal.organizationId` is NULL on all four rows. A
     portal needs no organization id at all.
   - The **restriction** is a property of the Rails *job*, not of a portal: it
     comes from that instance's `restrictions`/`mandates` tables, per job. In
     the production data only HAW's mandate actually restricts anything (36
     jobs); ZfS restricts one old job and the remaining mandates restrict
     nothing. So HAW is the only mandate that needs mapping to an
     `Organization.id`.

   The ETL imports any **non-HAW** mandate unrestricted and logs a warning, by
   design. That is one job today, but it is a deliberate hand-off rather than a
   silent drop — see the verification below.

   Run this in the Hasura console (**Data → SQL**) against production, or with
   `psql` from the migration VM in step 7.

   **Do not search for "HAW" alone.** HAW Kiel is the former *Fachhochschule
   Kiel* — the repo still calls it `FH_KIEL / HAW Kiel`, and `fh-kiel.stujo.net`
   is a live host — so the row may carry either name, or the spelled-out
   "Hochschule für Angewandte Wissenschaften". Cast the net wide and pick by
   eye; there will not be many rows:

   ```sql
   SELECT id, name, "legalName", type, aliases
   FROM "public"."Organization"
   WHERE name           ~* '(kiel|haw|fachhochschule|angewandte)'
      OR "legalName"    ~* '(kiel|haw|fachhochschule|angewandte)'
      OR aliases::text  ~* '(kiel|haw|fachhochschule|angewandte)'
   ORDER BY name;
   ```

   Expect CAU Kiel and HAW Kiel both to appear — they are different
   organizations and the portals are separate (`cau.stujo.net` vs
   `haw-kiel.stujo.net`). Take the HAW one.

   **If nothing comes back, HAW Kiel has no Organization row in production.**
   That is a real possibility and it is not a reason to skip the step:
   `stujo_migrate_prod.sh` refuses to start without `HAW_ORG_ID`, and importing
   with the wrong id would restrict those jobs to the wrong university —
   visible to the wrong students, invisible to the right ones. Create the
   organization first, then use its id.

   Confirm the id before using it, so a mis-paste fails here rather than
   silently in the import:

   ```sql
   SELECT id, name FROM "public"."Organization" WHERE id = <HAW_ORG_ID>;
   ```

   And verify it afterwards, as part of §3's checks — this should return one
   row, `HAW Kiel`, with roughly 36 jobs:

   ```sql
   SELECT o.name, count(*) AS restricted_jobs
   FROM "public"."JobPosting" jp
   JOIN "public"."Organization" o ON o.id = jp."restrictedToOrganizationId"
   WHERE jp."restrictedToOrganizationId" IS NOT NULL
   GROUP BY o.name;
   ```

   Then pick up the mandates the ETL deliberately did not map — grep its log:

   ```bash
   grep 'non-HAW mandates' etl.log
   ```

   Expect the single ZfS job. It is now visible to everyone rather than to ZfS
   members; decide whether that matters and restrict it by hand if so. An empty
   grep is also information: it means the source data changed since this was
   written, and the 36-job count above deserves a closer look.
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
| **Repoint** | `stujo.net`, `en`, `cau`, `fh-kiel`, `haw-kiel`, `flensburg` (A, proxied) and `www` (CNAME → apex, proxied) | **Import.** Declared in `09_stujo_net.tf`; importing makes the cutover an in-place `value` change. `www` needs no change at all — it follows the apex — but is declared so Terraform owns it. |
| **Leave to Microsoft 365** | `MX`, the SPF `TXT`, `_dmarc`, the `MS=` verification `TXT`, `selector1`/`selector2._domainkey`, `autodiscover` | **Do not import, do not declare.** This is working mail. Terraform cannot touch what it does not declare, so leaving them out is the *safe* option, not the lazy one. The one exception is the SPF record, which must be **edited by hand** to add Mailgun's include (§2.2 c) — editing it in the dashboard and leaving it unmanaged is fine and is what this plan assumes. |
| **Legacy `en.*`** | `en.stujo.net` (proxied) plus `cau.en`, `fh-kiel.en`, `flensburg.en`, `haw-kiel.en` (DNS-only) | `en.stujo.net` is **imported and repointed** with the rest — already proxied, so it costs nothing. The four third-level hosts are **left alone during the window**: they cannot be proxied without ACM, and they keep working off Strato until it is decommissioned. Decide then, §4.6. |
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

`01_main.tf` pins `cloudflare/cloudflare ~> 3.0` and **no lockfile is
committed**, so every `init` is free to resolve a different 3.x. Origin Rules
and Transform Rules are `cloudflare_ruleset` resources with the
`http_request_origin` and `http_request_late_transform` phases;
`09_stujo_net.tf` was written from the documented schema but could not be
validated where it was written (the provider registry is not reachable from
every environment this repo is edited in). Check it before relying on it.

**Step 1 — resolve the provider and check the schema. No credentials, no
state, nothing applied.**

```bash
cd infrastructure/application
terraform init          # downloads the provider; the cloud block only fetches state config
terraform version       # note the exact cloudflare version it resolved
terraform validate      # type-checks the config against the provider schema
```

`terraform validate` is the whole test for the structural question. It needs no
variables, no credentials and no state, and it fails loudly if
`cloudflare_ruleset` does not exist, or if `action_parameters.host_header` or
the `headers { expression = … }` form are not in the schema — which are exactly
the parts in doubt.

**Step 2 — commit the lockfile that `init` just wrote.**

```bash
git add .terraform.lock.hcl
```

This is worth doing regardless of the outcome. Without it, the version that
passes validate today is not necessarily the version that runs the apply, and
a provider that silently moves under a DNS change is not a risk worth carrying
for free.

**Step 3 — a speculative plan, for the parts a schema cannot check.** Phase
names and expression syntax are validated by Cloudflare's API, not by the
provider schema, so only a plan reaches them. Set `stujo_net_zone_id` in the
workspace and run `terraform plan`. With the `cloud` block this is a
**speculative** run: it reads, it reports, it changes nothing. Read it against
§4.3's expectations — imports, in-place updates, no destroys.

If you are not ready to leave the variable set, unset it again afterwards; the
plan has already told you what you needed.

**If the pinned version cannot express the rulesets**, in order of preference:

1. **Create the two rulesets by hand in the dashboard and import them later.**
   Origin Rules and Transform Rules are both UI features; this keeps the
   cutover on schedule and the provider version out of it. Add
   `import` blocks for `cloudflare_ruleset.stujo_net_origin[0]` and
   `cloudflare_ruleset.stujo_net_original_host[0]` afterwards — ruleset import
   IDs are `<zone_id>/<ruleset_id>`, and the ruleset id is in the URL of the
   rule in the dashboard.
2. Raise the provider version — but pin it exactly and read the upgrade guide
   first. This is not small: v4 and v5 both carry breaking changes, and v5
   renames `cloudflare_record` to `cloudflare_dns_record`, which touches every
   record in `02_network.tf` — the opencampus.sh zone that is serving
   production right now. **Do not bundle a provider major upgrade into this
   cutover.** Do it deliberately, on its own, afterwards.

### 4.5 One thing not to carry across

`02_network.tf` warns, correctly and loudly, that every record in the
**opencampus.sh** zone must stay DNS-only: those hosts are on the Google-managed
multi-SAN certificate, and a single proxied record breaks validation for the
whole certificate. The stujo.net records are the opposite — `proxied = true`,
because the proxy *is* the mechanism.

There is no conflict: these are different zones, and no stujo.net host is on
that certificate. But the two rules must not be swapped by someone tidying up
later. Never proxy an opencampus.sh record; never unproxy a stujo.net one.

### 4.6 The legacy `en.*` hosts — nothing to do in the window

The zone has five, and they split along the certificate boundary:

| Host | Proxy today | Why |
|---|---|---|
| `en.stujo.net` | **Proxied** | Second level — free Universal SSL covers it. |
| `cau.en`, `fh-kiel.en`, `flensburg.en`, `haw-kiel.en` | DNS only | Third level — Universal SSL does **not** reach it, and this zone has no ACM. |

That is not an oversight; it is the certificate limit, and somebody already
hit it.

**`en.stujo.net` is handled and costs nothing.** Already proxied, so
`09_stujo_net.tf` manages it like the other web hosts and `proxy.ts` 301s
`en.stujo.net/x` → `stujo.net/en/x`. The main English entry point survives the
move. No decision needed.

**The four third-level hosts: leave them alone during the cutover.** Proxying
them is not available — the zone is Free plan with zero SNI custom
certificates, so `*.en.stujo.net` would need an ACM subscription. But they do
not need touching either, because they point at Strato and **Strato stays up
read-only for an agreed period after the cutover** (§5.1). Until then they keep
working exactly as they do today.

**The 301 is not a way around the certificate.** It is tempting to think the
redirect saves us — `haw-kiel.en.stujo.net/x` → `haw-kiel.stujo.net/en/x`
lands on a host that *is* covered, so who needs a certificate for the old one?
The browser does. To be redirected, the visitor must first complete a TLS
handshake **with the old hostname**, and that needs a certificate valid for
`haw-kiel.en.stujo.net` — from Cloudflare if proxied (Universal SSL stops one
level short) or from whatever the record points at if DNS-only (the Google
load balancer's certificate covers `*.opencampus.sh` names, not these). Either
way there is no certificate, so the visitor gets a **certificate warning
instead of a redirect** — a scarier failure than a dead name, and one that
teaches people to click through warnings. Old inbound links are `https://`,
so this is the normal case, not the edge case.

Which is why the choice really is ACM or deletion. `proxy.ts` is ready for
these hosts either way; the redirect is not the missing piece, the certificate
is.

(An earlier draft of this section called leaving them "definitely wrong". That
was written assuming Strato dies at the cutover. It does not — so leaving them
is not just acceptable during the window, it is the right call: it removes a
decision from the riskiest hour and defers it to when there is data.)

**Decide at decommission, from the logs.** When Strato is switched off (§5.1),
the four records must go one way or the other:

- **Delete them.** Those English deep links then fail cleanly with NXDOMAIN,
  which is a better failure than resolving to a server that is gone. This is
  the default.
- **Buy ACM** for the zone, add `*.en.stujo.net` to it, proxy the four and add
  them to `local.stujo_net_origin_hosts` and `local.stujo_net_a_records`.
  `proxy.ts` already handles them — it 301s `haw-kiel.en.stujo.net/x` →
  `haw-kiel.stujo.net/en/x` — so this is a certificate purchase, not
  development work.

**How to get the data, since the obvious way does not work here.** These
records are DNS-only, so their traffic never reaches Cloudflare and **Cloudflare
Analytics cannot see it** — the dashboard will show nothing and that is not
evidence of nothing. The only record is on the Strato box: grep the nginx or
Rails access logs for those Host headers before it is archived (§5.1), while
the logs still exist. If the English portal URLs turn out to carry real
traffic, an ACM subscription is cheap next to re-earning it; if they carry
none, delete them without ceremony.

One side effect either way: Cloudflare's "your origin IP is partially exposed"
notice on this zone comes from exactly these DNS-only records sharing an IP
with the proxied ones. Proxying or deleting them clears it.

### 4.7 Verify, immediately after the apply

The apply in §4.3 *is* the repoint. The six web hosts stay **proxied A
records** and only their value changes, to `module.lb-http.external_ip`;
`www.stujo.net` stays a CNAME to the apex and does not change at all. No record
changes type, and none is replaced — a destroy-and-create in that plan means
something matched wrongly (§4.3 step 3). The two rulesets start acting on the
traffic at the same moment. Mail records are untouched; they were never in the
plan.

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

   Two things to do **before** the box is wiped, both of which become
   impossible afterwards:
   - **Pull the access logs**, or at least grep them for the
     `*.en.stujo.net` Host headers. That is the only place the traffic to those
     four DNS-only records is visible — Cloudflare never sees it — and it is
     what decides whether they are deleted or given an ACM certificate (§4.6).
   - **Then delete or repoint those four records.** Once Strato is off they
     resolve to nothing useful, and this is the moment that stops being
     harmless.
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

- ~~The host list in the stujo.net zone~~ — **answered: all 18 records, in
  §2.1.** Every host in the §1 table exists and is already proxied.
- Whether the pinned `cloudflare ~> 3.0` provider can express Origin Rules and
  Transform Rules (§4.4) — a plan answers it, and the fallback is to create
  those two rules by hand and import them later.
- ~~Whether `stujo.net` carries existing mail~~ — **answered: yes, Microsoft
  365, and `team@stujo.net` already exists** (§2.2). What remains is the
  by-hand SPF edit and making sure somebody reads that mailbox.
- ~~Whether ACM covers `*.en.stujo.net`~~ — **answered: no.** Free plan, zero
  SNI custom certificates. Nothing to do in the window; the four third-level
  hosts become a delete-or-buy-ACM decision at decommission, from the Strato
  logs (§4.6, §5.1).
- `HAW_ORG_ID` on production (§2.6).
- The **freeze window** and the communication texts (§2.9).
- Whether to build `/arbeitgeber` before or after the cutover (§5.5).
