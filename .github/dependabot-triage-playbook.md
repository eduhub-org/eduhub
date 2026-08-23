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
`chore(deps):` if nothing runtime-security was patched. Target `develop`, labels
`dependencies` and `chore`.

The body must contain:

- A table: alert # | package | severity | scope | decision | one-line reason.
- `## Patched` — what changed, to which version, and why it was judged relevant.
- `## Not patched — assessed as not relevant` — reviewer-checkable reasoning per alert, plus
  an explicit note that these remain **open** in GitHub and were **not** dismissed.
- `## Needs a manual decision` — major bumps and alerts with no available fix.
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

## 8. Nothing to do

If there are no patchable alerts and no superseded PRs, open nothing, update nothing, and
comment nowhere. Just report that.

## Hard limits

- Never push to `staging` or `production`.
- Never force-push a shared branch.
- Never merge or approve your own PR.
- Never dismiss a Dependabot alert.
- Never edit application logic to work around a vulnerability — dependency manifests,
  lockfiles and `resolutions` only.

Finish with a short summary: the PR link, counts patched / not-relevant / manual, and which
PRs were closed.
