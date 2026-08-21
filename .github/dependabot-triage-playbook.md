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
- No `first_patched_version` → cannot patch → NOT-RELEVANT, with that stated as the reason.
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

- **yarn**: `yarn up <pkg>@<version>` for direct deps. For transitive-only, add or raise a
  `resolutions` entry in `frontend-nx/package.json`, then
  `yarn install --mode=update-lockfile`. Never hand-edit `yarn.lock`.
- **npm**: in the function directory, `npm install <pkg>@<version>`, or
  `npm install <pkg>@<version> --package-lock-only` for transitive-only.
- **pip**: edit the pin in `requirements.txt`.
- **Maven**: bump the `<version>` in the relevant `pom.xml`.

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

Leave every other Dependabot PR **open**, and comment on it explaining why it was excluded
(e.g. "not included in today's triage: requires a major-version bump of X").

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
