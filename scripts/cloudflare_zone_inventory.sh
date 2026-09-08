#!/usr/bin/env bash
#
# Inventory a Cloudflare zone and emit Terraform import blocks for it.
#
# Two jobs, because they need the same data:
#
#   1. The zone inventory the cutover needs before anything is repointed
#      (docs/STUJO_PROD_CUTOVER.md §2.1) — every record, so that the ones which
#      must survive the move (MX, SPF, DKIM, DMARC, domain verification) are
#      known rather than discovered by their absence afterwards.
#   2. The `import` blocks that let Terraform ADOPT the records it is about to
#      change, instead of creating duplicates. Importing matters: a record that
#      is imported and then updated never stops resolving, while one that is
#      deleted and recreated leaves a window of NXDOMAIN that negative caching
#      can stretch well past its TTL.
#
# Read-only. It never writes to Cloudflare.
#
# Usage:
#   CF_API_TOKEN=...  ./scripts/cloudflare_zone_inventory.sh stujo.net
#   CF_API_EMAIL=... CF_API_KEY=...  ./scripts/cloudflare_zone_inventory.sh stujo.net
#
# The Global API Key (email + key) is the credential the Terraform provider
# already uses, so it needs nothing new. A scoped API token with Zone:Read is
# the better choice for a read-only inventory if you have one.
#
# Output:
#   <zone>-records.tsv   every record: type, name, content, proxied, ttl
#   <zone>-import.tf     import blocks for the records 09_stujo_net.tf declares
#
set -euo pipefail

ZONE_NAME="${1:-}"
if [[ -z "${ZONE_NAME}" ]]; then
  echo "usage: $0 <zone-name>   (e.g. stujo.net)" >&2
  exit 2
fi

API="https://api.cloudflare.com/client/v4"

auth_args() {
  if [[ -n "${CF_API_TOKEN:-}" ]]; then
    printf '%s\n' -H "Authorization: Bearer ${CF_API_TOKEN}"
  elif [[ -n "${CF_API_EMAIL:-}" && -n "${CF_API_KEY:-}" ]]; then
    printf '%s\n' -H "X-Auth-Email: ${CF_API_EMAIL}" -H "X-Auth-Key: ${CF_API_KEY}"
  else
    echo "ERROR: set CF_API_TOKEN, or both CF_API_EMAIL and CF_API_KEY" >&2
    exit 2
  fi
}
mapfile -t AUTH < <(auth_args)

api() {
  # Fails loudly rather than emitting a half inventory that reads as complete.
  local response
  response="$(curl -sS --fail-with-body -m 30 "${AUTH[@]}" "$@")"
  if [[ "$(printf '%s' "${response}" | python3 -c 'import json,sys; print(json.load(sys.stdin)["success"])')" != "True" ]]; then
    echo "ERROR: Cloudflare API call failed:" >&2
    printf '%s\n' "${response}" >&2
    exit 1
  fi
  printf '%s' "${response}"
}

echo "Looking up zone ${ZONE_NAME}…" >&2
ZONE_ID="$(api "${API}/zones?name=${ZONE_NAME}" \
  | python3 -c 'import json,sys; z=json.load(sys.stdin)["result"]; print(z[0]["id"] if z else "")')"
if [[ -z "${ZONE_ID}" ]]; then
  echo "ERROR: no zone named ${ZONE_NAME} is visible to these credentials." >&2
  exit 1
fi
echo "  zone_id = ${ZONE_ID}" >&2

# Paginate: a zone with more records than one page would otherwise be reported
# as complete while missing exactly the records nobody remembered.
page=1
records_json="$(mktemp)"
trap 'rm -f "${records_json}"' EXIT
echo '[]' > "${records_json}"
while :; do
  body="$(api "${API}/zones/${ZONE_ID}/dns_records?per_page=100&page=${page}")"
  count="$(printf '%s' "${body}" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["result"]))')"
  printf '%s' "${body}" | python3 -c '
import json, sys
existing = json.load(open(sys.argv[1]))
existing.extend(json.load(sys.stdin)["result"])
json.dump(existing, open(sys.argv[1], "w"))
' "${records_json}"
  [[ "${count}" -lt 100 ]] && break
  page=$((page + 1))
done

TSV="${ZONE_NAME}-records.tsv"
python3 - "${records_json}" "${TSV}" <<'PY'
import json, sys
records = sorted(json.load(open(sys.argv[1])), key=lambda r: (r["type"], r["name"]))
with open(sys.argv[2], "w") as out:
    out.write("type\tname\tcontent\tproxied\tttl\tid\n")
    for r in records:
        out.write("\t".join([
            r["type"], r["name"], str(r.get("content", "")),
            str(r.get("proxied", "")), str(r.get("ttl", "")), r["id"],
        ]) + "\n")
print(f"{len(records)} records -> {sys.argv[2]}", file=sys.stderr)
PY

# Import blocks, but only for the hosts 09_stujo_net.tf actually declares.
# Anything else in the zone is left alone on purpose: Terraform does not delete
# what it does not know about, and adopting a record nobody can explain is how
# a zone loses a record it needed.
IMPORTS="${ZONE_NAME}-import.tf"
python3 - "${records_json}" "${ZONE_ID}" "${IMPORTS}" <<'PY'
import json, sys

records, zone_id, path = json.load(open(sys.argv[1])), sys.argv[2], sys.argv[3]

# Must match the resources in infrastructure/application/09_stujo_net.tf.
# www is its own resource because it stays a CNAME to the apex.
declared = {
    "stujo.net":           'cloudflare_record.stujo_net["stujo.net"]',
    "en.stujo.net":        'cloudflare_record.stujo_net["en.stujo.net"]',
    "cau.stujo.net":       'cloudflare_record.stujo_net["cau.stujo.net"]',
    "haw-kiel.stujo.net":  'cloudflare_record.stujo_net["haw-kiel.stujo.net"]',
    "fh-kiel.stujo.net":   'cloudflare_record.stujo_net["fh-kiel.stujo.net"]',
    "flensburg.stujo.net": 'cloudflare_record.stujo_net["flensburg.stujo.net"]',
    "www.stujo.net":       "cloudflare_record.stujo_net_www[0]",
}

by_name = {}
for r in records:
    if r["type"] in ("A", "AAAA", "CNAME"):
        by_name.setdefault(r["name"], []).append(r)

lines = [
    "# Generated by scripts/cloudflare_zone_inventory.sh — review before applying.",
    "# Delete this file once the import has been applied; the blocks are then no-ops.",
    "",
]
missing, ambiguous = [], []
for host, address in declared.items():
    found = by_name.get(host, [])
    if not found:
        missing.append(host)
        continue
    if len(found) > 1:
        ambiguous.append(host)
        continue
    lines += [
        "import {",
        f"  to = {address}",
        f'  id = "{zone_id}/{found[0]["id"]}"',
        "}",
        "",
    ]

open(path, "w").write("\n".join(lines))
print(f"import blocks -> {path}", file=sys.stderr)

# The two groups most easily lost in a zone move, called out by name rather
# than left for someone to spot in a 40-line table.
mail = [r for r in records if r["type"] in ("MX", "TXT")
        or "_domainkey" in r["name"] or r["name"].startswith("autodiscover.")
        or r["name"].startswith("_dmarc.")]
if mail:
    print("\n  MAIL and verification records — NOT imported, decide per §4.2:", file=sys.stderr)
    for r in sorted(mail, key=lambda r: (r["type"], r["name"])):
        print(f"    {r['type']:6} {r['name']}", file=sys.stderr)

legacy = [r for r in records if ".en." in r["name"] or r["name"].startswith("en.")]
if legacy:
    print("\n  Legacy en.* locale hosts — see §4.6 before proxying them:", file=sys.stderr)
    for r in sorted(legacy, key=lambda r: r["name"]):
        print(f"    {r['type']:6} {r['name']}  proxied={r.get('proxied')}", file=sys.stderr)
if missing:
    print("\n  NOT in the zone (Terraform will CREATE these, which is fine for a", file=sys.stderr)
    print("  host that never existed — but check it is not a typo):", file=sys.stderr)
    for h in missing:
        print(f"    {h}", file=sys.stderr)
if ambiguous:
    print("\n  MORE THAN ONE record — resolve by hand, an import block takes one id:", file=sys.stderr)
    for h in ambiguous:
        print(f"    {h}", file=sys.stderr)
PY

cat >&2 <<EOF

Next:
  1. Read ${TSV}. Everything that must survive the move — MX, SPF, DKIM,
     DMARC, domain verification — is in there and is NOT covered by the import
     blocks. Decide per record whether Terraform should adopt it (§4.2).
  2. Put ${IMPORTS} in infrastructure/application/ and set
     stujo_net_zone_id = "${ZONE_ID}" in the workspace.
  3. Plan. The plan is the cutover review: imports, then the value/proxied
     changes on the records being repointed. Nothing applies until you say so.
EOF
