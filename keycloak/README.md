# Configs made in keycloak frontend

Keep the Keycloak image tag in `Dockerfile` / `Dockerfile-dev` (`quay.io/keycloak/keycloak:…`) in sync with `keycloak.version` in `spi/matrix-handle-listener/pom.xml`, and rebuild `libs/matrix-handle-listener.jar` after changing either.

Use `scripts/rebuild-keycloak-matrix-handle-listener.sh` from the repository root after changing the Keycloak version. Use `scripts/rebuild-keycloak-matrix-handle-listener.sh --check` to verify the POM, Dockerfiles, and checked-in JAR are aligned.

- Set themes of your realm to the one you like most or create your own.
- Set smtp server data in the mail config of your realm
- Set client config for Zoom registration
