#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPI_DIR="$ROOT_DIR/keycloak/spi/matrix-handle-listener"
POM_FILE="$SPI_DIR/pom.xml"
JAR_FILE="$ROOT_DIR/keycloak/libs/matrix-handle-listener.jar"
JAR_POM_PATH="META-INF/maven/sh.opencampus.keycloak/matrix-handle-listener/pom.xml"
TARGET_JAR="$SPI_DIR/target/matrix-handle-listener.jar"

usage() {
  cat <<'EOF'
Usage:
  scripts/rebuild-keycloak-matrix-handle-listener.sh
  scripts/rebuild-keycloak-matrix-handle-listener.sh --check

Rebuilds keycloak/libs/matrix-handle-listener.jar from the SPI source.
With --check, verifies that the source POM, Dockerfile tags, and embedded JAR
POM all use the same Keycloak version without rebuilding.
EOF
}

read_pom_keycloak_version() {
  sed -nE 's/.*<keycloak.version>([^<]+)<\/keycloak.version>.*/\1/p' "$1" | head -n 1
}

read_dockerfile_keycloak_versions() {
  sed -nE 's/^FROM quay\.io\/keycloak\/keycloak:([^ ]+).*/\1/p' "$1" | sort -u
}

read_jar_keycloak_version() {
  if [[ ! -f "$JAR_FILE" ]]; then
    echo "missing"
    return
  fi

  unzip -p "$JAR_FILE" "$JAR_POM_PATH" 2>/dev/null | sed -nE 's/.*<keycloak.version>([^<]+)<\/keycloak.version>.*/\1/p' | head -n 1
}

check_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

check_versions() {
  check_command unzip

  local expected
  expected="$(read_pom_keycloak_version "$POM_FILE")"

  if [[ -z "$expected" ]]; then
    echo "Error: could not read keycloak.version from $POM_FILE" >&2
    exit 1
  fi

  local failed=0
  local dockerfile

  for dockerfile in "$ROOT_DIR/keycloak/Dockerfile" "$ROOT_DIR/keycloak/Dockerfile-dev"; do
    local versions
    versions="$(read_dockerfile_keycloak_versions "$dockerfile")"

    if [[ "$versions" != "$expected" ]]; then
      echo "Version mismatch: ${dockerfile#$ROOT_DIR/} uses ${versions:-none}, expected $expected" >&2
      failed=1
    fi
  done

  local jar_version
  jar_version="$(read_jar_keycloak_version)"

  if [[ "$jar_version" != "$expected" ]]; then
    echo "Version mismatch: ${JAR_FILE#$ROOT_DIR/} embeds ${jar_version:-none}, expected $expected" >&2
    failed=1
  fi

  if [[ "$failed" -ne 0 ]]; then
    exit 1
  fi

  echo "Keycloak SPI versions are aligned at $expected"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--check" ]]; then
  if [[ "$#" -ne 1 ]]; then
    usage >&2
    exit 1
  fi

  check_versions
  exit 0
fi

if [[ "$#" -ne 0 ]]; then
  usage >&2
  exit 1
fi

check_command mvn

mvn -q -f "$POM_FILE" -DskipTests package
cp "$TARGET_JAR" "$JAR_FILE"
check_versions
