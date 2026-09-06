###############################################################################
# The stujo.net zone in Cloudflare
#####
#
# stujo.net is not served by our load balancer. Each host here is a PROXIED
# record whose Origin Rule rewrites the origin Host to the matching
# <service>.opencampus.sh name — which is what the shared load balancer routes
# on (url_mask) and what its certificate already covers. A Host override in an
# Origin Rule sets the SNI to the same value, so the zone stays on Full
# (strict). The visitor's address bar keeps saying stujo.net, because a proxy
# is not a redirect. See docs/STUJO_PROD_CUTOVER.md §4.
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
# ── Adopting a zone that already exists ─────────────────────────────────────
#
# The zone predates this file and its records still point at the old platform.
# Terraform is not authoritative over a Cloudflare zone: it only knows what is
# declared here, so applying this touches nothing else in the zone. The records
# below are meant to be IMPORTED rather than created — importing turns the
# cutover into an in-place update with no window where the name does not
# resolve. scripts/cloudflare_zone_inventory.sh generates the import blocks.
###############################################################################

locals {
  # Empty unless a stujo.net zone is configured, so every workspace without one
  # (staging, dev) plans clean rather than trying to create records in a zone
  # that is not theirs.
  stujo_net_enabled = var.stujo_net_zone_id != ""

  # Visitor host -> the origin host its traffic must arrive at. The value is
  # both the CNAME target and the Host header the Origin Rule sets, so the two
  # can never drift apart.
  #
  # The en.* legacy locale hosts are deliberately absent: proxy.ts 301s them,
  # but they only need records here if the zone inventory (§2.1) shows them
  # still in use. Add them to this map if it does.
  stujo_net_hosts = local.stujo_net_enabled ? {
    "stujo.net"             = local.stujo_domain
    "www.stujo.net"         = local.stujo_domain
    "cau.stujo.net"         = local.stujo_portals["stujo-cau"].domain
    "haw-kiel.stujo.net"    = local.stujo_portals["stujo-haw-kiel"].domain
    "fh-kiel.stujo.net"     = local.stujo_portals["stujo-haw-kiel"].domain
    "flensburg.stujo.net"   = local.stujo_portals["stujo-flensburg"].domain
  } : {}

  # One Origin Rule per distinct origin, matching every visitor host that maps
  # to it — four rules rather than six.
  stujo_net_origins = local.stujo_net_enabled ? {
    for origin in distinct(values(local.stujo_net_hosts)) : origin => [
      for host, target in local.stujo_net_hosts : host if target == origin
    ]
  } : {}
}

# The records themselves. Proxied, so Cloudflare terminates TLS for the visitor
# and the Origin Rule below decides what the origin sees. A CNAME at the apex
# is fine: Cloudflare flattens it.
resource "cloudflare_record" "stujo_net" {
  for_each = local.stujo_net_hosts

  zone_id = var.stujo_net_zone_id
  name    = each.key
  type    = "CNAME"
  value   = each.value
  proxied = true
  # Proxied records must carry the automatic TTL; Cloudflare rejects anything
  # else, and pinning it stops a dashboard edit from drifting.
  ttl = 1
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
resource "cloudflare_zone_settings_override" "stujo_net" {
  count = local.stujo_net_enabled ? 1 : 0

  zone_id = var.stujo_net_zone_id

  settings {
    ssl = "strict"
  }
}
