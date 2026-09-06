import type { IncomingMessage } from 'http';

/**
 * The hostname the visitor actually asked for.
 *
 * A portal reached through Cloudflare — every stujo.net host, and any partner
 * domain (see docs/STUJO_PROD_CUTOVER.md §6) — arrives with its origin `Host`
 * rewritten to the `<service>.opencampus.sh` name the load balancer routes on.
 * Resolving branding from that rewritten value would render whichever portal
 * happens to own the *origin*, so the visitor's own host has to be read from
 * the `X-Original-Host` header the Cloudflare rule sets.
 *
 * Unlike the redirect in proxy.ts, this needs no allowlist: the value is only
 * ever looked up in JobPortalDomain, so a forged header can at worst render
 * another portal's public branding, and an unknown one falls through to the
 * existing AppSettings / APP_NAME resolution.
 *
 * That safety comes entirely from the lookup being an EXACT match against a
 * table of public portals. The value itself is attacker-settable and is not
 * parsed or validated here, so it must not be used to build a URL, scope a
 * cookie, or decide anything about authorization. proxy.ts parses it strictly
 * for exactly that reason.
 */
export function portalHost(req: Pick<IncomingMessage, 'headers'>): string | undefined {
  const forwarded = req.headers['x-original-host'];
  const original = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return original?.trim() || req.headers.host;
}
