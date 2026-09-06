###############################################################################
# The stujo.net zone in Cloudflare
#####
#
# stujo.net is not served by our load balancer. Each web host is a PROXIED
# record whose Origin Rule rewrites the origin Host to the matching
# <service>.opencampus.sh name — which is what the shared load balancer routes
# on (url_mask) and what its certificate already covers. A Host override in an
# Origin Rule sets the SNI to the same value, so the zone stays on Full
# (strict). The visitor's address bar keeps saying stujo.net, because a proxy
# is not a redirect. See docs/STUJO_PROD_CUTOVER.md §4.
#
# ── The zone is ALREADY proxied ─────────────────────────────────────────────
#
# stujo.net, www and the portal hosts are orange-cloud today, pointing at the
# old Strato server. That makes this cutover unusually cheap: the public DNS
# answer is already Cloudflare's anycast address and does not change at all.
# Only the ORIGIN behind the proxy moves, which takes effect at once and is
# invisible to resolver caches.
#
# Two consequences for how this file is written:
#
#   * The records stay A records pointing at the load balancer IP, rather than
#     becoming CNAMEs to <service>.opencampus.sh. Same destination either way
#     (the Origin Rule, not the record, decides the origin Host), but changing
#     a record's TYPE can force Terraform to destroy and recreate it, and a
#     recreate is the one thing that would put a gap in a name that currently
#     resolves. An A -> A value change is an in-place update.
#   * www.stujo.net is left as the CNAME to the apex that it already is. Its
#     Host header is still www.stujo.net, so it still needs an Origin Rule —
#     but it needs no DNS change at all.
#
# ── proxied = true here, and that is NOT a contradiction of 02_network.tf ────
#
# 02_network.tf warns that every record in the opencampus.sh zone must stay
# DNS-only, because Google-managed certificate validation needs those hosts to
# resolve straight to the load balancer IP. That constraint belongs to THAT
# ZONE. stujo.net is a different zone, holds no host on the Google certificate,
# and is useless unproxied — the proxy is the entire mechanism. Do not carry
# either rule across: never proxy an opencampus.sh record, never unproxy one
# here.
#
# ── The zone carries mail, and none of it is managed here ───────────────────
#
# stujo.net is a Microsoft 365 mail domain: autodiscover, the selector1/
# selector2 DKIM CNAMEs, its MX and its SPF all live in this zone and are
# deliberately absent from this file. Terraform is not authoritative over a
# Cloudflare zone — it only knows what is declared — so applying this cannot
# touch them. Adding Mailgun for team@stujo.net means EDITING the existing SPF
# record, not adding a second one (§2.2).
###############################################################################

locals {
  # Empty unless a stujo.net zone is configured, so every workspace without one
  # (staging, dev) plans clean rather than trying to create records in a zone
  # that is not theirs.
  stujo_net_enabled = var.stujo_net_zone_id != ""

  # Visitor host -> the origin host its traffic must arrive at. This drives the
  # Origin Rules, and every host that must be SERVED needs an entry here —
  # including www, whose DNS record this file does not manage.
  #
  # The en.* legacy locale hosts are absent on purpose. They exist in the zone
  # but are DNS-only today, and proxying a third-level host needs the ACM
  # certificate to cover *.en.stujo.net (§2.1). Decide that first; see §4.6.
  stujo_net_origin_hosts = local.stujo_net_enabled ? {
    "stujo.net"           = local.stujo_domain
    "www.stujo.net"       = local.stujo_domain
    "cau.stujo.net"       = local.stujo_portals["stujo-cau"].domain
    "haw-kiel.stujo.net"  = local.stujo_portals["stujo-haw-kiel"].domain
    "fh-kiel.stujo.net"   = local.stujo_portals["stujo-haw-kiel"].domain
    "flensburg.stujo.net" = local.stujo_portals["stujo-flensburg"].domain
  } : {}

  # The A records this file manages: every served host except www, which is a
  # CNAME to the apex and follows it. Trim this to what the zone inventory
  # actually contains — a host listed here but absent from the zone is CREATED,
  # which is right for a host that should exist and wrong for a typo.
  stujo_net_a_records = local.stujo_net_enabled ? toset([
    "stujo.net",
    "cau.stujo.net",
    "haw-kiel.stujo.net",
    "fh-kiel.stujo.net",
    "flensburg.stujo.net",
  ]) : toset([])

  # One Origin Rule per distinct origin, matching every visitor host that maps
  # to it — four rules rather than six.
  stujo_net_origins = local.stujo_net_enabled ? {
    for origin in distinct(values(local.stujo_net_origin_hosts)) : origin => [
      for host, target in local.stujo_net_origin_hosts : host if target == origin
    ]
  } : {}
}

# The web hosts. Already proxied and already A records; this changes only where
# they point. Import them (§4.3) so that stays an in-place update.
resource "cloudflare_record" "stujo_net" {
  for_each = local.stujo_net_a_records

  zone_id = var.stujo_net_zone_id
  name    = each.value
  type    = "A"
  value   = module.lb-http.external_ip
  proxied = true
  # Proxied records must carry the automatic TTL; Cloudflare rejects anything
  # else, and pinning it stops a dashboard edit from drifting.
  ttl = 1
}

# www follows the apex, so it needs no change when the apex moves. Declared
# anyway, at its current value, so that Terraform owns it and a later edit
# cannot quietly point it somewhere else.
resource "cloudflare_record" "stujo_net_www" {
  count = local.stujo_net_enabled ? 1 : 0

  zone_id = var.stujo_net_zone_id
  name    = "www.stujo.net"
  type    = "CNAME"
  value   = "stujo.net"
  proxied = true
  ttl     = 1
}

# Origin Rules: rewrite the origin Host (and with it the SNI) to the name the
# load balancer routes on and the certificate covers. Without this the origin
# would be asked for `cau.stujo.net`, which it holds no certificate for.
resource "cloudflare_ruleset" "stujo_net_origin" {
  count = local.stujo_net_enabled ? 1 : 0

  zone_id     = var.stujo_net_zone_id
  name        = "StuJo origin host override"
  description = "Serve each stujo.net host from its <service>.opencampus.sh origin"
  kind        = "zone"
  phase       = "http_request_origin"

  dynamic "rules" {
    for_each = local.stujo_net_origins
    content {
      action      = "route"
      description = "stujo.net -> ${rules.key}"
      expression  = "(http.host in {${join(" ", [for h in rules.value : "\"${h}\""])}})"
      enabled     = true

      action_parameters {
        host_header = rules.key
      }
    }
  }
}

# The visitor's real host, for the app. Everything downstream of the Origin
# Rule sees the rewritten Host, so without this header a legacy job link would
# 301 the visitor off stujo.net and a portal would render the origin's
# branding. See frontend-nx/apps/stujo/proxy.ts and lib/requestHost.ts.
resource "cloudflare_ruleset" "stujo_net_original_host" {
  count = local.stujo_net_enabled ? 1 : 0

  zone_id     = var.stujo_net_zone_id
  name        = "StuJo original host"
  description = "Pass the visitor's own host to the origin as X-Original-Host"
  kind        = "zone"
  phase       = "http_request_late_transform"

  rules {
    action      = "rewrite"
    description = "X-Original-Host = http.host"
    expression  = "true"
    enabled     = true

    action_parameters {
      headers {
        name       = "X-Original-Host"
        operation  = "set"
        expression = "http.host"
      }
    }
  }
}

# Full (strict) holds because the Origin Rule sets the SNI to a name the
# origin certificate covers. Strict is also what makes a misconfigured host
# fail loudly instead of quietly serving from the wrong origin.
#
# Check the zone's CURRENT mode before applying: it is proxied today with a
# Strato origin, so it may well be on Flexible or Full. Moving to strict is
# correct for the new origin and wrong for the old one — so this applies in the
# same change that repoints the records, not before it.
resource "cloudflare_zone_settings_override" "stujo_net" {
  count = local.stujo_net_enabled ? 1 : 0

  zone_id = var.stujo_net_zone_id

  settings {
    ssl = "strict"
  }
}
