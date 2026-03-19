# AGENTS.md

## Cursor Cloud specific instructions

### Overview

EduHub is a Docker-based monorepo. All services run via `docker compose up` from the repository root. See `README.md` for quick start and `docs/DEVELOPMENT_GUIDE.md` for full details.

### Services

| Service | Port | Purpose |
|---------|------|---------|
| frontend-nx | 5000 (edu-hub) | Next.js app |
| hasura | 8080 | GraphQL API |
| keycloak | 28080 | Auth (admin/admin) |
| db_hasura | 5432 (internal) | PostgreSQL |
| node_functions | 42000-42024, 4001 | Node serverless functions |
| python_functions | 42025-42026 | Python serverless functions |

### Starting the dev environment

```bash
cd /workspace
docker compose up -d
```

Wait for all services: Keycloak and Hasura take ~30-60s on first start. The frontend container runs `yarn install` internally before starting Next.js dev server, which may take 1-2 minutes on first boot.

Login: `admin@example.com` / `dev`

### Cloud startup bootstrap (Python checks)

To avoid per-session `pip install` during security and pytest checks, run this once at agent startup:

```bash
bash /workspace/scripts/bootstrap_cloud_agent_python.sh
```

The script installs `/workspace/functions/apiProxy/requirements.txt` with `--user` and caches by requirements-file hash, so repeated sessions skip reinstall when unchanged.

### Docker-in-Docker gotchas

The Cloud Agent VM runs inside a Firecracker VM with a nested Docker container. Required workarounds:

- **fuse-overlayfs**: Kernel doesn't fully support overlay2; `/etc/docker/daemon.json` must set `"storage-driver": "fuse-overlayfs"`.
- **iptables-legacy**: Must use `update-alternatives --set iptables /usr/sbin/iptables-legacy` before starting dockerd.
- **dockerd startup**: Run `sudo dockerd &>/tmp/dockerd.log &` then grant socket access with `sudo chmod 666 /var/run/docker.sock`.

### Lint, test, build

Commands run on the **host** (not inside Docker), from `frontend-nx/`:

- **Lint**: `yarn lint` (matches CI)
- **Test**: `yarn test`
- **Build**: `yarn build`

Requires Node.js 20.x (`nvm use 20`) and Yarn 3.4.1 (via Corepack).

### Known issues

- **Jest/Babel version conflict**: Tests fail with `Requires Babel "^7.22.0"` error because `next/babel` needs a newer Babel than what `jest-config` bundles. This is a pre-existing repo issue, not an environment problem.

### Environment variables

Copy `.env.example` to `.env` at the repo root for optional Formbricks/Stripe integration. Services work without these values.

### Skills

See `.cursor/skills/` for task-specific instructions: `start-dev`, `lint-project`, `run-tests`, `regenerate-types`, `create-migration`.
