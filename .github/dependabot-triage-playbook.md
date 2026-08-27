# Dependabot triage playbook

Triage the open Dependabot alerts for `eduhub-org/eduhub` and consolidate every needed
change into **one** pull request against `develop`. Work autonomously and finish in one
session.

This file is the instruction set for `.github/workflows/dependabot-triage.yml`, which reads
it on every scheduled run. It deliberately lives here rather than in `.claude/commands/`:
the job pushes branches, opens pull requests and closes other people's pull requests, so it
should not be a slash command that every developer with a checkout can fire by accident.
To run it by hand, point Claude Code at this path.

## 0. Preflight — fail loudly, never silently

```bash
gh auth status
gh api "/repos/eduhub-org/eduhub/dependabot/alerts?state=open&per_page=1"
```

The alerts endpoint needs a token with `security_events` (or `public_repo`, since this repo
is public). The **default Actions `GITHUB_TOKEN` cannot read it** — in CI, `GH_TOKEN` is set
from the `DEPENDABOT_TRIAGE_TOKEN` secret.

If the endpoint returns 403 or 404, stop. Do **not** open a triage PR, and do not touch any
Dependabot PR. Instead:

1. Search for an existing open issue titled `Dependabot triage: cannot read security alerts`.
2. If one exists, add a comment with today's date and the exact error. If not, open it.
3. Stop.

A run that looks clean because it read nothing is the worst possible outcome — an empty PR
reads as "no vulnerabilities" to whoever reviews it.

Stopping here stops the **alert-driven** half of the job only. The watchlist pass in section
2b does not use this endpoint, so it still runs — see *When preflight failed* there.

## 1. Repository layout and package managers

| Path | Manager | Notes |
| --- | --- | --- |
| `frontend-nx/` | Yarn 3.4.1 (`nodeLinker: node-modules`) | Next.js app, `frontend-nx/yarn.lock`. The only deployed frontend. |
| `functions/<name>/` | npm (`package-lock.json`) | Cloud Functions. |
| `functions/apiProxy`, `functions/callPythonFunction` | pip (`requirements.txt`) | |
| `keycloak/spi/*` | Maven (`pom.xml`) | |

## 2. Collect

```bash
gh api /repos/eduhub-org/eduhub/dependabot/alerts --paginate
gh pr list --repo eduhub-org/eduhub --author "app/dependabot" --state open --json number,title,headRefName
```

Per alert, capture: `number`, `security_advisory.severity`, `dependency.package.name`,
`dependency.package.ecosystem`, `dependency.scope`, `dependency.manifest_path`,
`security_advisory.ghsa_id`, `security_advisory.summary`, `security_advisory.description`,
any `vulnerable_functions`, and `security_vulnerability.first_patched_version.identifier`.

Alert data alone is not enough to choose a version — see section 4, *Pick the target
version*. For every package you intend to touch, also look up what upstream currently
ships. Advisory metadata lags releases, and `first_patched_version` is the **oldest**
release carrying the fix, not the newest release available.

## 2b. Watchlist — what the alerts API cannot tell you

Sections 0 and 2 read the Dependabot alerts API, and that API is generated from the
**global** GitHub Advisory Database, which sits downstream of the maintainers. A project
that publishes an advisory on its own repository and ships the fix reaches its users days
before the global database mirrors it, and an advisory that never receives a CVE may never
produce an alert here at all. For most dependencies that lag is an acceptable trade. For
the handful this application is actually exposed through it is not — and a run reading only
the alerts API cannot tell "no alert" apart from "not ingested yet".

That is not hypothetical. On 2026-08-25 Next.js published two **critical** unauthenticated
RCE advisories — `GHSA-2xp9-vwfh-vxw4` (RCE in the Image Optimization API via crafted AVIF
files, CVSS 9.5) and `GHSA-p293-qw3h-jr36` (RCE on Windows-hosted servers) — and shipped
the fix in 16.3.3. This repo was on 16.2.11, inside both vulnerable ranges. The run on
2026-08-26 — the morning after publication — read the alerts API, found 11 open alerts, and
none of them was `next`: the advisories had not reached the global database, so no alert
existed to find. It reported a clean bill on a live critical RCE in the server that renders
every page. The gap was closed on 2026-08-27 by a human who had read about it elsewhere and
patched it by hand in #1881 — not by this job, which had no way to see it.

Run this pass **on every run**, after section 2 and before section 3.

`.github/security-watchlist.yml` names the dependencies it covers and, for each, the
exposure that earns it a place. Read it. If it is missing or unparseable, that is a hard
error: say so and stop, exactly as a failed preflight would.

### The check

For each entry, ask the upstream project directly instead of the advisory database:

```bash
gh api "/repos/<upstream>/security-advisories?state=published&per_page=30" \
  --jq '.[] | {ghsa_id, severity, published_at, summary,
               vulns: [.vulnerabilities[] | {pkg: .package.name,
                                             range: .vulnerable_version_range,
                                             patched: .patched_versions}]}'
```

That endpoint is public. It needs no `security_events` scope and works on any public
repository — which is exactly why it sees what the alerts API has not ingested yet.

If the `--jq` filter comes back empty, **drop the filter and read the raw JSON before
concluding anything.** An empty result is a tooling failure until proven otherwise — a
renamed field or a 404 on a moved repository looks exactly like "this project has published
no advisories", and mistaking one for the other is the whole failure this section exists to
prevent. Confirm against the project's releases or security page before recording a
watchlist entry as clear, and say in the PR body which of the two you established.

Then resolve what this repo actually ships — the **resolved version in the lockfile**, not
the range in `package.json`, and the image tag for a container — and compare it against
every published advisory's vulnerable range. Do not filter by publication date: an advisory
from months ago whose range still covers the shipped version is still a finding, and a date
filter would make this pass depend on when it last ran.

**Second check, for the fix that ships without an advisory.** Not every security fix gets
one; some land in a release with a line in the changelog and nothing else. For each
watchlist entry, compare the shipped version against the newest release in its bump class —
section 4 already requires resolving that — and where there is a gap, read the release notes
between the two for security language. A fix described only in a changelog counts as a
finding here.

### What a watchlist hit means

Treat a hit as a Dependabot alert of the severity **upstream** assigned, with three
differences:

- **The cool-down in section 4 does not apply.** These are the packages where a known
  exploitable hole outweighs the risk of a young release. Take the patched version the day
  it ships.
- **Reachability does not gate the patch.** Section 3 still applies and you still record
  the assessment — but for a watchlist package at high or critical severity, where the fix
  is a patch or minor bump, patch first and write the reasoning down second. "This one
  probably isn't reachable for us" belongs in the PR body, never in the decision to leave it
  unpatched. Of the two Next.js advisories above only the AVIF one was reachable here —
  nothing is Windows-hosted — and the bump that closed it closed both.
- **A hit is never silently absent from the output.** Patched, it goes under `## Watchlist`
  in the PR body. Needing a major bump, it goes to the standing issue in section 8 **and**
  gets named at the top of the PR body. With no PR this run, that standing issue is the
  record.

**Never conclude a watchlist package is fine because it has no Dependabot alert.** The
absence of an alert is the condition this section exists to compensate for.

### When preflight failed

Section 0 stops the run when the alerts API is unreadable, and that still holds for
alert-driven work: no triage PR gets opened from alert data you could not read. This pass
does not use that API, so **run it anyway**. If it finds a high or critical hit, patch it
and open a PR whose title and body say plainly that it is watchlist-only and that the alert
set could not be read. What section 0 guards against is a PR that looks comprehensive while
resting on nothing — not a narrow one that is honest about its scope. Record the alerts
failure on the tracking issue as section 0 requires, either way.

## 3. Assess relevance — this is the core of the job

Classify every alert as **PATCH**, **NOT-RELEVANT**, or **NEEDS-MANUAL-DECISION**, judged
against the actual code rather than the advisory text alone.

- `scope: development` deps (build tooling, test libs, codegen) ship to nobody. Treat as
  NOT-RELEVANT unless exploitable at build time — supply-chain/registry compromise, or
  reachable in CI with untrusted input.
- For runtime deps, check **reachability**: grep for the import, and for the specific
  vulnerable function or option the advisory names. State whether user-controlled input can
  actually reach it.
- EduHub context: users are students and instructors authenticated via Keycloak. There are
  public course pages, file uploads, certificate PDF generation, and mail sending. The app
  is server-side rendered, so Node-side dependencies are reachable at runtime.
- No `first_patched_version` → **check upstream before believing it.** A null
  `first_patched_version` means GitHub has not recorded a patched release, which is not the
  same as no fix existing: the fix may have shipped in a release published after the
  advisory was last edited. Look at the project's own releases and security page for the
  affected minor before concluding anything. Only when upstream genuinely has no fix does
  this become NEEDS-MANUAL-DECISION — never NOT-RELEVANT, since "no fix exists" is not
  evidence that the dependency is unreachable. Either way, record the reachability
  assessment and the upstream check (with the release or advisory URL you consulted) so the
  next run, and a human, can act on it.
- **A vulnerable-range upper bound is not "no fix".** Advisories for projects with several
  supported branches list one affected range per branch, and each range's exclusive upper
  bound *is* that branch's fix: `< 26.6.5` means 26.6.5 is the patched release for the 26.6
  line, not that 26.6.4 is the end of the road. An alert showing `<= 26.6.4` is therefore
  reporting a branch boundary, not an absent fix. Read every range on the advisory, find the
  one containing the version in this repo, and take the fix from it — or move to a newer
  branch that is also patched.
- Fix requires a **major** version bump of a runtime dep → NEEDS-MANUAL-DECISION. Do not
  attempt it.
- When unsure whether something is exploitable, treat it as relevant and patch it if a safe
  patch/minor bump exists. **Bias toward reporting over silence.**

**Never dismiss a Dependabot alert via the API, under any circumstances.** Alerts assessed
as not relevant stay open for a human to decide on.

## 4. Patch

Single branch: `chore/dependabot-triage`.

**Idempotence first** — this runs daily, so never stack up PRs:

```bash
gh pr list --repo eduhub-org/eduhub --head chore/dependabot-triage --state open
```

If a PR already exists, check that branch out, merge `develop` into it, and extend it. If
not, delete any stale local and remote copy of the branch and cut it fresh from
`origin/develop`.

**Pick the target version — `first_patched_version` is a floor, not the answer.**

Before editing any manifest, resolve the version you are moving to, and record it:

```bash
npm view <pkg> versions --json | tail -20        # npm / yarn
pip index versions <pkg>                        # pip
gh release list --repo <owner>/<repo> --limit 5 # Maven, containers, anything GitHub-released
```

Rules:

- Target the **newest release within the bump class you are allowed to make** — the latest
  patch of the current minor by default, not merely the oldest release that closes the
  alert. Shipping `first_patched_version` when a newer patch exists knowingly deploys the
  vulnerabilities fixed in between; those show up as new alerts on the next run.
- Check the upstream release notes between the version in the repo and your target for
  other security fixes, and mention them in the PR body. One bump usually closes more than
  the alert that prompted it.
- **Cool-down: prefer a release that has been out for at least 7 days**, and treat 14 days as
  comfortable. A release published in the last day or two has had no time to surface
  regressions, and this job runs daily — waiting a week costs one more run, while shipping a
  day-old release can cost a rollback. Compare the release date against today, not the
  version number.
- **Security overrides the cool-down.** Take a release immediately, at any age, when it
  fixes: the alert you are triaging; anything **high or critical**; or anything in the
  authentication-bypass, account-takeover, privilege-escalation, signature-verification or
  RCE classes, regardless of the score attached to it. The cool-down exists to avoid
  regressions in routine bumps, never to leave a known exploitable hole in place. When you
  take a release early, say which fix justified it in the `## Patched` table.
- **A watchlist hit (section 2b) waives the cool-down outright**, at whatever severity
  upstream assigned it. Those packages are on the list precisely because this repo's
  exposure to them outweighs the regression risk of a release published this morning.
- When the cool-down defers a bump, do **not** silently ship the older version as if it were
  the target. Patch to the newest *eligible* release, and record in `## Needs a manual
  decision` which newer release you deferred, its publication date, and the date it becomes
  eligible — so the next run picks it up instead of rediscovering it.
- If the newest patch of the current minor is still vulnerable and only a **minor or major**
  bump fixes it, the existing rules apply: a safe minor is fine, a major runtime bump is
  NEEDS-MANUAL-DECISION.
- State the chosen version and why in the `## Patched` table, so a reviewer can see it was
  picked deliberately rather than copied out of the alert.

Then apply the bump with the manager that owns the manifest:

- **yarn**: run every yarn command from inside `frontend-nx/` — the Yarn 3.4.1 release and
  its settings come from `frontend-nx/.yarnrc.yml`, and the repo root has its own
  `package.json` that must not be touched. `cd frontend-nx && yarn up <pkg>@<version>` for
  direct deps. For transitive-only, add or raise a `resolutions` entry in
  `frontend-nx/package.json`, then `cd frontend-nx && yarn install --mode=update-lockfile`.
  Never hand-edit `yarn.lock`.
- **npm**: in the function directory, `npm install <pkg>@<version>`, or
  `npm install <pkg>@<version> --package-lock-only` for transitive-only.
- **pip**: edit the pin in `requirements.txt`.
- **Maven**: bump the `<version>` in the relevant `pom.xml`.
- **Keycloak** (`keycloak/spi/matrix-handle-listener`): the pom alone remediates **nothing**.
  All four Keycloak dependencies there are `provided` scope, so the vulnerable code that
  actually runs is the `quay.io/keycloak/keycloak` base image. A Keycloak bump therefore
  means all four of these together, or it is not a fix:
  1. `<keycloak.version>` in `keycloak/spi/matrix-handle-listener/pom.xml`
  2. the `FROM quay.io/keycloak/keycloak:<tag>` lines in **both** `keycloak/Dockerfile` and
     `keycloak/Dockerfile-dev`
  3. `keycloak/libs/matrix-handle-listener.jar`, which is a **committed binary**
  4. `scripts/rebuild-keycloak-matrix-handle-listener.sh --check` passing, which is what CI
     enforces

  **Always rebuild the jar — this step is not optional and not conditional.** Any time you
  touch the Keycloak version, run:

  ```bash
  scripts/rebuild-keycloak-matrix-handle-listener.sh
  ```

  with no arguments. That compiles the SPI against the new version and copies the result over
  `keycloak/libs/matrix-handle-listener.jar`, then verifies alignment. Commit the changed jar
  along with the pom and the Dockerfiles.

  Do not skip it on the assumption that only a version string changed: the jar embeds its own
  copy of the POM, so a version-only bump still leaves the committed jar stale, and CI's
  `--check` compares exactly that embedded value. **Nothing in CI rebuilds the jar for you** —
  the `keycloak-code-checks` workflow runs only `--check`, which compares versions and fails;
  it never regenerates the binary. Never hand-edit or repackage the jar by any other means,
  and never bump the version and leave the rebuild for a follow-up commit — a pushed
  pom/Dockerfile bump without the rebuilt jar is a red CI run.

  The script needs `mvn`, a JDK and `unzip` on PATH. If any is missing, or the build fails,
  say so and stop rather than committing a version bump with a stale jar.

  Because the shipped artifact is a container image rather than a Maven coordinate, resolve
  the target tag from Keycloak's own releases (`gh release list --repo keycloak/keycloak`),
  not from the advisory's `first_patched_version`. Flag in the PR body that this changes the
  deployed identity provider and needs a login-flow smoke test on staging before promotion.

## 5. Verify

If `frontend-nx/` changed, reproduce CI (`.github/workflows/frontend-code-checks.yml`):

```bash
cd frontend-nx && yarn install --immutable && yarn build && yarn lint
```

If `yarn build` fails for reasons unrelated to your bump — missing `NEXT_PUBLIC_*` env vars
or other secrets are expected in a bare CI sandbox — say so explicitly in the PR body and
fall back to `yarn install --immutable`, `yarn lint`, and `npx tsc --noEmit`.

If a check fails **because of** a bump, revert that one bump, move it to
NEEDS-MANUAL-DECISION with the error quoted, and re-verify. Never open a PR with a red build
you already know about.

If a `functions/` directory changed, at minimum confirm `npm ci` resolves there.

## 6. One PR

Conventional commit and PR title: `fix(deps): dependabot triage YYYY-MM-DD` — use
`chore(deps):` if nothing runtime-security was patched. A watchlist hit (section 2b) is
runtime security by definition, so it always makes this `fix(deps):`. Target `develop`, labels
`dependencies` and `chore`.

The body must contain:

- A table: alert # | package | severity | scope | decision | one-line reason.
- `## Patched` — what changed, to which version, and why it was judged relevant.
- `## Not patched — assessed as not relevant` — reviewer-checkable reasoning per alert, plus
  an explicit note that these remain **open** in GitHub and were **not** dismissed.
- `## Watchlist` — every hit from section 2b: package, upstream advisory, severity, the
  version shipped here, the version patched to, and whether a Dependabot alert existed for
  it. Say so explicitly when none did — that gap is the point of the section, and a reviewer
  should be able to see how far ahead of the alerts API this run was. If the pass found
  nothing, one line saying which packages were checked and against what.
- `## Needs a manual decision` — major bumps and alerts with no available fix.
- `## Deployed exposure` — section 9. Omit only when nothing is exposed.
- `## Verification` — the exact commands run and their outcomes.
- `## Superseded Dependabot PRs` — which PRs were closed.

## 7. Close superseded Dependabot PRs — only those

Close a Dependabot PR **only** if its bump is included in your PR at a version greater than
or equal to the one it proposed:

```bash
gh pr comment <n> --body "Superseded by #<PR> (consolidated Dependabot triage)."
gh pr close <n> --delete-branch
```

Leave every other Dependabot PR **open**. When this run created or updated the consolidated
triage PR, comment on each excluded one explaining why (e.g. "not included in today's triage:
requires a major-version bump of X"). When the run produced no triage PR at all, comment
nowhere — see section 8; a daily "nothing changed" note on every open Dependabot PR is noise,
not information.

## 8. Nothing to patch

Two outcomes here, and they are not the same. Do not conflate them.

**Nothing patchable, nothing superseded, and nothing awaiting a human** → open nothing,
update nothing, comment nowhere. Just report it.

**Nothing patchable, but alerts still classified NEEDS-MANUAL-DECISION** → those must not
evaporate into a run log. Once the patchable backlog is clear, this is the steady state:
every run re-derives the same manual-decision set, and with no PR to write it into, nobody
ever sees it. Maintain one standing issue, the way preflight does:

1. Search for an open issue titled `Dependabot triage: alerts needing a manual decision`.
2. If none exists and there is at least one manual-decision alert, open it. List each alert
   with its package, severity, scope, why it needs a human rather than a bump, and the
   options — so it can be acted on without re-deriving the analysis.
3. If one exists, comment **only when the set has changed** since the last comment: an alert
   added, one that became patchable, one upstream fixed, one whose severity moved. An
   unchanged set gets no comment — a daily "still N items" note is noise, not information.
4. When the set empties, close the issue with a comment saying which alerts cleared and how.

Never open one issue per alert. Never use the issue to restate what a triage PR already
says: when this run created or updated the consolidated PR, that PR body is the record, and
the issue needs only a link to it.

Items that no future run can resolve on its own deserve particular care here — a fix that
exists but is out of scope for automated triage (a major runtime bump), or an observation
that is not an alert at all (drift, inconsistent pins across manifests). Those have no
automated path to resolution, so the standing issue is the only place they survive.

Watchlist hits (section 2b) and deployed exposure (section 9) belong in this issue on the
same terms, and they are the two kinds of finding most likely to arrive on a run with no PR
to write them into. A watchlist hit recorded here keeps its upstream advisory ID and
severity, so nobody has to re-derive it. Deployed exposure stays listed until the promotion
actually happens — not until the fix merges to `develop`.

## 9. Deployed exposure — a fix on `develop` is not a fix in production

`develop` is where this job works, and the hard limits below keep it there. But a patch
merged to `develop` protects nobody until it is promoted, and this job is the only thing
looking at these packages every day. So finish each run by checking where the fix actually
got to.

For every watchlist package, compare what `develop` ships against `staging` and
`production`:

```bash
git fetch origin develop staging production
for br in develop staging production; do
  echo -n "$br: "; git show "origin/$br:frontend-nx/package.json" | grep '"<pkg>"'
done
```

Use the same comparison for the container images in the watchlist, reading the tag out of
each branch's `backend/Dockerfile` and `keycloak/Dockerfile`.

Report every branch still carrying a version inside a known vulnerable range under
`## Deployed exposure` in the PR body — naming the branch, the version it serves, the
advisory, and the version that closes it. When there is no PR this run, it goes on the
standing issue from section 8 instead and stays there until the promotion happens.

This is reporting, not acting. **Never push to `staging` or `production`** (see the hard
limits): the promotion is a human's decision and follows the repo's release workflow. The
job here is to make sure nobody has to work out on their own that the fix is still sitting
on `develop`.

Say it plainly in the PR body when it applies, because it is the easy thing to assume away:
a merged security PR and a patched deployment are not the same event. On 2026-08-27, #1881
had put Next.js 16.3.3 on `develop` while `staging` and `production` both still served
16.2.11 — the critical AVIF RCE was closed in the repository and open in production.

## Hard limits

- Never push to `staging` or `production` — report the exposure instead (section 9).
- Never force-push a shared branch.
- Never merge or approve your own PR.
- Never dismiss a Dependabot alert.
- Never edit application logic to work around a vulnerability — dependency manifests,
  lockfiles and `resolutions` only.

Finish with a short summary: the PR link, counts patched / not-relevant / manual, and which
PRs were closed.
