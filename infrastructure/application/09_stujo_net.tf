###############################################################################
# The stujo.net zone in Cloudflare
#####
#
# stujo.net is served through a Cloudflare Worker. Each web host is a PROXIED
# record and a Worker route maps it to the matching <service>.opencampus.sh
# origin. Fetching that URL sets both the origin Host and SNI to a name the
# shared load balancer routes and its certificate covers. The visitor's
# address bar keeps saying stujo.net because the Worker returns the upstream
# response rather than redirecting. See docs/STUJO_PROD_CUTOVER.md §4.
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
#     (the Worker, not the record, decides the origin Host), but changing
#     a record's TYPE can force Terraform to destroy and recreate it, and a
#     recreate is the one thing that would put a gap in a name that currently
#     resolves. An A -> A value change is an in-place update.
#   * www.stujo.net is left as the CNAME to the apex that it already is. Its
#     Host header is still www.stujo.net, so it still needs a Worker route —
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
# selector2 DKIM CNAMEs, the MS= verification TXT, its MX and its SPF all live
# in this zone and are deliberately absent from this file. Terraform is not
# authoritative over a Cloudflare zone — it only knows what is declared — so
# applying this cannot touch them.
#
# It also publishes DMARC at `p=reject`. That is the strictest policy there is:
# mail that fails DMARC for stujo.net is REJECTED, not spam-foldered. Nothing
# in this file affects that, but it is why var.mailgun_additional_domains must
# stay empty until Mailgun has verified the domain and its DKIM is live (§2.2).
###############################################################################

locals {
  # Empty unless a stujo.net zone is configured, so every workspace without one
  # (staging, dev) plans clean rather than trying to create records in a zone
  # that is not theirs.
  stujo_net_enabled = var.stujo_net_zone_id != ""

  # Visitor host -> the origin host its traffic must arrive at. This drives the
  # Worker, and every host that must be SERVED needs an entry here —
  # including www, whose DNS record this file does not manage.
  #
  # en.stujo.net is here, its four third-level siblings are not, and the split
  # is not arbitrary. Universal SSL covers one level, so `en.stujo.net` can be
  # proxied for free — and it already is — while `cau.en.stujo.net` and the
  # rest cannot be, which is exactly why they sit DNS-only in the zone today.
  # Proxying those needs *.en.stujo.net on an Advanced Certificate Manager
  # certificate, and this zone has none — it is on the Free plan with zero SNI
  # custom certificates. They are therefore DELETED by hand during the cutover
  # (§4.6) rather than managed here. If ACM is ever bought, add them to this map
  # and to stujo_net_a_records; proxy.ts already knows what to do with them.
  #
  # en.stujo.net needs no portal of its own: it only has to REACH the app, and
  # proxy.ts 301s it to stujo.net/en/... from there.
  stujo_net_origin_hosts = local.stujo_net_enabled ? {
    "stujo.net"           = local.stujo_domain
    "www.stujo.net"       = local.stujo_domain
    "en.stujo.net"        = local.stujo_domain
    "cau.stujo.net"       = local.stujo_portals["stujo-cau"].domain
    "haw-kiel.stujo.net"  = local.stujo_portals["stujo-haw-kiel"].domain
    "fh-kiel.stujo.net"   = local.stujo_portals["stujo-haw-kiel"].domain
    "flensburg.stujo.net" = local.stujo_portals["stujo-flensburg"].domain
  } : {}

  # The A records this file manages: every served host except www, which is a
  # CNAME to the apex and follows it. All six exist in the zone today, proxied,
  # pointing at the Strato address — so every one of these is an import
  # followed by an in-place value change, and the plan should contain no
  # creates at all.
  stujo_net_a_records = local.stujo_net_enabled ? toset([
    "stujo.net",
    "en.stujo.net",
    "cau.stujo.net",
    "haw-kiel.stujo.net",
    "fh-kiel.stujo.net",
    "flensburg.stujo.net",
  ]) : toset([])

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

# Proxy to the existing opencampus.sh origins. The Worker changes the fetch URL
# (therefore Host and SNI) and explicitly tells the app which public hostname
# the visitor used. This avoids the Enterprise-only Origin Rule Host override.
resource "cloudflare_worker_script" "stujo_net" {
  count = local.stujo_net_enabled ? 1 : 0

  account_id = var.stujo_net_account_id
  name       = "stujo-net-origin-proxy"
  content    = <<-JS
    const ORIGINS = ${jsonencode(local.stujo_net_origin_hosts)};

    addEventListener("fetch", event => {
      event.respondWith(proxy(event.request));
    });

    async function proxy(request) {
      const incoming = new URL(request.url);
      const origin = ORIGINS[incoming.hostname];

      if (!origin) {
        return new Response("Unknown StuJo host", { status: 421 });
      }

      const upstream = new URL(request.url);
      upstream.protocol = "https:";
      upstream.hostname = origin;
      upstream.port = "";

      const proxied = new Request(upstream.toString(), request);
      proxied.headers.set("X-Original-Host", incoming.hostname);
      return fetch(proxied);
    }
  JS
}

resource "cloudflare_worker_route" "stujo_net" {
  for_each = local.stujo_net_origin_hosts

  zone_id     = var.stujo_net_zone_id
  pattern     = "${each.key}/*"
  script_name = cloudflare_worker_script.stujo_net[0].name
}

# Full (strict) holds because the Worker fetches a hostname the origin
# certificate covers. Strict is also what makes a misconfigured host
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
