Start and inspect the EduHub Docker development stack.

## Main command

From the repository root:

```bash
docker compose up           # foreground
docker compose up -d        # detached
docker compose up --build   # rebuild images first (after Dockerfile changes)
```

## Services

| Service | URL | Notes |
|---------|-----|-------|
| Frontend (Next.js) | http://localhost:5000 | hot reload |
| Hasura console | http://localhost:8080 | GraphQL at `/v1/graphql` |
| Keycloak | http://localhost:28080 | admin / admin |
| PostgreSQL | not exposed | accessed by Hasura container |
| Node functions | 42000-42024, 4001 | serverless |
| Python functions | 42025-42026 | serverless |

Default app login: `admin@example.com` / `dev`.

## Expected timing

- First boot: 30-60 s for Hasura/Keycloak.
- Frontend container: extra 1-2 min for the first `yarn install` inside the
  container. Subsequent boots reuse the cached `node_modules`.

## Useful variants

```bash
docker compose up frontend-nx hasura     # subset of services
docker compose logs -f frontend-nx       # tail logs
docker compose restart hasura            # apply metadata changes
docker compose down                      # stop, keep volumes
docker compose down -v                   # stop, wipe DB and Keycloak data
```

## Host vs container

Lint, tests, type-check, and build run on the **host** from `frontend-nx/`,
not inside containers. Use `nvm use 20` and Yarn 3.4.1 via Corepack.

## Cloud / Docker-in-Docker

If running inside a Cloud VM (Firecracker), apply these workarounds before the
first `docker compose up`:

```bash
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
echo '{"storage-driver":"fuse-overlayfs"}' | sudo tee /etc/docker/daemon.json
sudo dockerd &>/tmp/dockerd.log &
sleep 5
sudo chmod 666 /var/run/docker.sock
```

For Python serverless dev, run once per agent session to avoid per-call
`pip install`:

```bash
bash /workspace/scripts/bootstrap_cloud_agent_python.sh
```

## Reporting

When helping the user start the stack, mention the command used, the primary
URLs, and any startup wait that matters for what they're trying to do.
