# AGENTS.md

EduHub is a Docker-based monorepo: Next.js frontend, Hasura GraphQL, PostgreSQL,
Keycloak/NextAuth, and Node/Python serverless functions. Run everything with
`docker compose up` from the repo root.

## Stack and key paths

| Layer | Tech | Path |
|-------|------|------|
| Frontend | Next.js + TypeScript + Material-UI + Apollo + `next-intl` | `frontend-nx/apps/edu-hub/` |
| GraphQL API | Hasura | `backend/metadata/`, `backend/migrations/` |
| Database | PostgreSQL | tracked in Hasura metadata |
| Auth | Keycloak + NextAuth | `keycloak/` |
| Serverless | Node + Python | `functions/` |

Frontend internals:
- `components/` — feature-based (e.g. `pages/CourseContent/Projects/`)
- `components/common/`, `components/inputs/` — shared building blocks
- `queries/*.ts` — GraphQL documents; types generated into `queries/__generated__/`
- `locales/de.json`, `locales/en.json` — translations (German must use informal "Du")
- `hooks/authedQuery.ts`, `hooks/authedMutation.ts` — role-aware Apollo hooks

## Services and ports

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5000 | Next.js dev server, hot reload |
| Hasura | http://localhost:8080 | GraphQL endpoint `/v1/graphql` |
| Keycloak | http://localhost:28080 | admin/admin |
| Postgres | internal | not exposed by default |

Default login: `admin@example.com` / `dev`.

## Host commands (run from `frontend-nx/` with Node 20 + Yarn 3.4.1)

```bash
nvm use 20
yarn lint           # ESLint (matches CI)
yarn test           # Jest + RTL
yarn test:e2e       # Playwright against a running `docker compose up` stack
yarn build
GRAPHQL_URI=http://localhost:8080/v1/graphql yarn apollo   # regenerate GraphQL types
```

E2E specs live in `frontend-nx/e2e/` and attach to a running stack — they never
start one. CI runs them via `.github/workflows/e2e-tests.yml`, which boots the
compose stack and serves a production build. See `frontend-nx/e2e/README.md`.

Note: `yarn test` previously failed with `Requires Babel "^7.22.0"` (next/babel
vs jest-config). This is now fixed by pinning `@babel/core` to `7.29.7` via a
`resolutions` entry in `frontend-nx/package.json`.

## Critical rules (never break these)

1. **GraphQL hooks**: Use `useRoleQuery` / `useRoleMutation` /
   `useAdminQuery` / `useAdminMutation` / `useInstructorQuery` from
   `hooks/authedQuery.ts` and `hooks/authedMutation.ts`. `useAuthedQuery` is
   deprecated — it now just delegates to `useRoleQuery`, but new code must call
   the role-aware hooks directly so the Hasura role matches the caller.
2. **Roles** are lowercase: `admin`, `instructor`, `user`, `anonymous`
   (`AuthRoles` enum in `types/enums.ts`). The Hasura `x-hasura-role` header is
   set in `config/apollo.ts` from the current session role.
3. **Schema changes touch five layers in order**: SQL migration → Hasura
   metadata YAML → `tables.yaml` include → GraphQL documents in
   `frontend-nx/apps/edu-hub/queries/` → regenerate types → grep `functions/`
   for affected names. Not done until all five are done. See
   `.claude/commands/create-migration.md`.
4. **Translations**: all user-facing strings go through `useTranslations()` from
   `next-intl`. Add keys to both `de.json` and `en.json`. German uses the
   informal "Du" form (never "Sie"). Database ENUM values keep their `ALL_CAPS`
   form as keys for a 1:1 mapping.
5. **Reuse existing components** before creating new ones: `ErrorMessageDialog`,
   `QuestionConfirmationDialog`, `NotificationSnackbar`, `DialogShell`,
   `InputField`, `DropDownSelector`, `CreatableTagSelector`, `TableGrid`
   (under `components/common/` and `components/inputs/`).
6. **Database naming**: tables PascalCase (quoted), columns camelCase, timestamp
   columns `created_at`/`updated_at` (snake_case), foreign keys `{tableName}Id`,
   primary keys named `id`. Do NOT add `admin` permissions in Hasura metadata —
   admin has full access by default.
7. **Conventional commits, 80-char line cap**: `feat:` minor, `fix:` patch,
   `perf:` patch, `BREAKING CHANGE`/`!` major. Use `chore:` for branch-promotion
   merges. Semantic-release only runs on pushes to `production`.
8. **Branch flow**: `develop` → `staging` → `production`. Never edit version
   fields in any `package.json` or `CHANGELOG.md` by hand.
9. **Docker image rebuilds**: `docker compose up` reuses an existing image and
   does NOT detect Dockerfile/baked-content changes. After changing a
   `Dockerfile`, Keycloak provider jars/version, a pinned `image:` tag, or
   serverless function dependencies, run the right `build` / `pull` / `restart`
   and tell the user. Full decision table: `.cursor/rules/docker-rebuild.mdc`.

## Behavioral guidelines (Karpathy)

- State assumptions before coding; ask if uncertain.
- Minimum code that solves the problem; no speculative abstractions.
- Touch only what the task requires; match existing style.
- Define a verifiable success criterion before implementing.

## Skills (slash commands)

Detailed playbooks live in `.claude/commands/`. Invoke a skill when its
trigger applies — these files are self-contained and may duplicate small
context from this file by design.

| Command | Use when |
|---------|----------|
| `/start-dev` | Bringing up Docker stack or tailing service logs |
| `/lint-project` | Running ESLint |
| `/run-tests` | Running or scoping Jest tests |
| `/regenerate-types` | After any GraphQL document or schema change |
| `/create-migration` | Adding/altering tables, columns, constraints |
| `/graphql-backend` | Coordinating GraphQL/Hasura schema and permission changes |
| `/frontend-patterns` | Building or refactoring React components and pages |
| `/security-auth` | Auth, role checks, Keycloak, NextAuth, Hasura permissions |
| `/conventional-commits` | Drafting a commit message |
| `/release-workflow` | Promoting branches and reasoning about release impact |
| `/cherrypick-hotfix` | Backporting a production fix to `develop`/`staging` |
| `/version-update-summaries` | User-facing release notes for Slack/announcements |
| `/create-project-issue` | Filing a GitHub issue on the EduHub project board |
| `/pencil-design` | Reading/editing `.pen` design files via the Pencil MCP |

**Browser / UI inspection:** Prefer MCP server **`cursor-ide-browser`** (Cursor’s
internal Browser tab — sees the user’s open tabs, session, and cookies). Use
**`user-playwright`** only as a **fallback** when `cursor-ide-browser` is
unavailable (MCP not enabled, tool errors, no Browser tab, or environments like
Claude Code without the Cursor IDE browser). If the user **explicitly** asks for
Playwright (headless, E2E, isolated session), use Playwright directly. When
falling back, say briefly that you are not on the user’s Cursor tab. Details:
`.cursor/rules/cursor-browser-mcp.mdc`, `.cursor/skills/cursor-browser/`.

Related sources (kept in sync but not loaded automatically): `.cursor/rules/`
(Cursor format) and `.codex/skills/` (Codex format). Prefer the `.claude/commands/`
versions when they disagree; treat `frontend-nx/.releaserc.json` and
`.github/workflows/release.yml` as the final word on release behavior.
