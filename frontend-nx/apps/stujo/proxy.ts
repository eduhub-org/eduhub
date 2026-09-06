/**
 * Legacy StuJo → EduHub cutover redirects (plan §7.3 step 4).
 *
 * Next 16 renamed `middleware.ts` to `proxy.ts` (the exported function must be
 * called `proxy`); the old name is deprecated and is no longer picked up
 * reliably, so this file must keep that name. Unlike middleware, the proxy runs
 * in the Node runtime — which is what lets the canonical redirect below read a
 * plain runtime env var instead of a build-time NEXT_PUBLIC_ flag.
 *
 * Three cases, all 301 (Next's `{ permanent: true }` helper emits 308, so the
 * status is set explicitly):
 *   1. A DIRECT hit on an interim `*.opencampus.sh` production host → its
 *      `stujo.net` equivalent, so one domain is the public face. Gated on
 *      STUJO_CANONICAL_REDIRECTS, so pre-cutover QA on the interim hosts keeps
 *      working and staging (which never sets it) is never affected.
 *   2. `*.en.stujo.net/<path>` → `<portal>.stujo.net/en/<path>` (the Rails
 *      app's host-based locale → the next i18n path locale).
 *   3. `/stellenangebote/:oldId-:slug` → `/stellenangebote/:newId`, resolving
 *      the old Rails id through JobPosting.legacyStujoId.
 *
 * ## stujo.net arrives with a rewritten Host
 *
 * stujo.net is not served by our load balancer. Cloudflare proxies its hosts
 * and rewrites the origin Host to the matching `<service>.opencampus.sh` name,
 * which is what the load balancer routes on and what its certificate covers.
 * So on a stujo.net request the `Host` header says `stujo-cau.opencampus.sh`
 * while the visitor's address bar says `cau.stujo.net`, and the Cloudflare rule
 * passes the real one in `X-Original-Host`.
 *
 * Two consequences, both handled below: a redirect must be built from the
 * ORIGINAL host, or it would move the visitor off stujo.net; and case 1 must
 * fire only when that header is absent, or every proxied request would be sent
 * back to stujo.net, re-proxied, and redirected again — a loop.
 *
 * `/arbeitgeber/:oldId-:slug` is deliberately NOT redirected: that route does
 * not exist in this app yet (plan §8.2). The resolver is ready in
 * lib/legacyRedirects.ts.
 */
import { NextRequest, NextResponse } from 'next/server';
import { lookupNewJobId } from './lib/legacyRedirects';

export const config = {
  // Page routes only — skip Next internals, the API, and static assets
  // (anything with a file extension). "/" is listed separately: the negative
  // lookahead pattern does not match the bare root, and the portal landing
  // page is exactly what a legacy inbound link hits most often.
  matcher: ['/', '/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};

const EN_SUFFIX = '.en.stujo.net';

/** i18n defaultLocale from next.config.js — the default locale carries no path prefix. */
const DEFAULT_LOCALE = 'de';

// Keyed by exact host, so the staging hosts (stujo-staging.opencampus.sh, …)
// can never match even if the flag were set there by accident.
const CANONICAL_HOSTS: Record<string, string> = {
  'stujo.opencampus.sh': 'stujo.net',
  'stujo-cau.opencampus.sh': 'cau.stujo.net',
  'stujo-haw-kiel.opencampus.sh': 'haw-kiel.stujo.net',
  'stujo-flensburg.opencampus.sh': 'flensburg.stujo.net',
};

/**
 * Header the Cloudflare rule carries the visitor's real host in, since the
 * origin Host has been rewritten by then. Its presence is also what marks a
 * request as "arrived through Cloudflare", i.e. already on stujo.net.
 */
const ORIGINAL_HOST_HEADER = 'x-original-host';

/**
 * The interim `*.opencampus.sh` hosts stay publicly reachable, so anyone can
 * send `X-Original-Host` themselves — nothing about the header proves it came
 * from Cloudflare. The header therefore has two different trust levels here:
 *
 * - Its PRESENCE only decides whether to skip the canonical redirect. Forging
 *   that costs an attacker nothing but the redirect they would have got, and it
 *   has to work for hosts this file has never heard of — a partner's own domain
 *   (docs/STUJO_PROD_CUTOVER.md §6) is proxied exactly like a stujo.net host and
 *   must be served, not bounced to stujo.net.
 * - Its VALUE is only used to BUILD a `Location`, and there an unchecked host
 *   would make this an open redirect: a link on our own domain that lands on
 *   someone else's. So a redirect is built from it only for a host in the
 *   stujo.net zone — the zone whose legacy URLs these redirects exist for.
 *   For any other forwarded host there is nothing safe to redirect to, so the
 *   request is simply served.
 */
const STUJO_NET_SUFFIX = '.stujo.net';
const isStujoNetHost = (hostname: string) =>
  hostname === 'stujo.net' || hostname.endsWith(STUJO_NET_SUFFIX);

/**
 * Strictly parses a `Host`-shaped value into its hostname and its authority.
 *
 * A suffix test on the raw string is not enough, because several characters end
 * the authority in a URL and hand the rest to something else: `@` starts the
 * host, while `/`, `?` and `#` start the path, query and fragment. Each lets a
 * value pass a "does it end in .stujo.net?" or "does it start with it?" check
 * while the browser reads an entirely different host out of the Location
 * header — `stujo.net:443@attacker.example` and `attacker.example#.en.stujo.net`
 * both navigate to attacker.example.
 *
 * So the value is accepted only as a bare `hostname[:port]` of DNS labels, and
 * the caller uses the parsed parts rather than the original text. Anything else
 * — including a bracketed IPv6 literal, which no host of ours is reached by —
 * returns null and is treated as if the header had not been sent at all.
 */
const HOST_PATTERN = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*)(?::(\d{1,5}))?$/;

type ParsedHost = { hostname: string; authority: string };

const parseHost = (value: string | null | undefined): ParsedHost | null => {
  const raw = value?.trim().toLowerCase();
  if (!raw) return null;
  const match = raw.match(HOST_PATTERN);
  if (!match) return null;
  const port = match[2];
  if (port && (Number(port) < 1 || Number(port) > 65535)) return null;
  return { hostname: match[1], authority: raw };
};

/**
 * Runtime flag (set on the Cloud Run service by Terraform, see
 * var.stujo_net_canonical). Read per request rather than at module load so a
 * revision that only changes the env var takes effect without a rebuild — the
 * flag must not turn on before Cloudflare is serving stujo.net.
 */
const canonicalRedirectsEnabled = () => process.env.STUJO_CANONICAL_REDIRECTS === 'true';

/** True for the locale prefix itself, but not for paths like `/energie`. */
const hasEnPrefix = (pathname: string) => pathname === '/en' || pathname.startsWith('/en/');

/**
 * The locale prefix Next strips out of `nextUrl.pathname`. It has to be put
 * back by hand, because these redirects build their Location header from the
 * request headers rather than from `nextUrl` — see below.
 */
const localePrefix = (locale: string | undefined) =>
  locale && locale !== DEFAULT_LOCALE ? `/${locale}` : '';

/**
 * Absolute redirect target.
 *
 * Deliberately NOT `nextUrl.clone()`: `nextUrl`'s origin is the address the
 * server listens on (`0.0.0.0:5001` on Cloud Run), not the host the visitor
 * asked for, so cloning it sends the browser to an unreachable internal URL.
 * The host is the visitor's own (X-Original-Host ahead of Host, so a stujo.net
 * visitor stays on stujo.net), and the scheme comes from `x-forwarded-proto`
 * (with the request's own scheme as the local-dev fallback, so
 * http://localhost:5001 keeps working).
 */
const absoluteUrl = (req: NextRequest, host: string, path: string) => {
  const forwardedProto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.nextUrl.protocol.replace(':', '');
  return `${protocol}://${host}${path}${req.nextUrl.search}`;
};

/**
 * Applies the three cutover redirects above and passes everything else
 * through untouched. Every lookup failure falls through rather than erroring:
 * a redirect that cannot be resolved must never take a page down.
 */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  // The host the visitor sees: what Cloudflare forwarded, else the Host header
  // itself (a direct hit on an opencampus.sh host, or local development).
  // An unparseable value counts as absent: a genuine Cloudflare rule always
  // sends a plain host, so the only thing rejecting the rest costs is a 301.
  const forwardedHost = parseHost(req.headers.get(ORIGINAL_HOST_HEADER));
  const directHost = parseHost(req.headers.get('host') || req.nextUrl.host);
  const visitorHost = forwardedHost || directHost;
  const hostname = visitorHost?.hostname ?? '';
  // …and the host a redirect may be built from — see the two trust levels
  // above. Always the PARSED authority, never the raw header text.
  const redirectHost = forwardedHost
    ? isStujoNetHost(forwardedHost.hostname)
      ? forwardedHost.authority
      : null
    : (directHost?.authority ?? null);
  // With the pages-router i18n config, Next normalizes the locale out of
  // `pathname` and exposes it as `nextUrl.locale`.
  const { pathname } = req.nextUrl;
  const prefix = localePrefix(req.nextUrl.locale);

  // 1) A direct hit on an interim opencampus.sh host → its stujo.net
  //    equivalent (path, locale prefix and query kept). Always https: the
  //    public domain is. Skipped for anything arriving through Cloudflare —
  //    that request is already on its public domain and redirecting it would
  //    loop (and would drag a partner's domain onto stujo.net).
  const canonicalHost = forwardedHost ? undefined : CANONICAL_HOSTS[hostname];
  if (canonicalHost && canonicalRedirectsEnabled()) {
    const path = `${prefix}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(`https://${canonicalHost}${path || '/'}${req.nextUrl.search}`, 301);
  }

  // 2) Host-based locale: *.en.stujo.net → <portal>.stujo.net/en/...
  if (hostname === 'en.stujo.net' || hostname.endsWith(EN_SUFFIX)) {
    const newHost =
      hostname === 'en.stujo.net' ? 'stujo.net' : `${hostname.slice(0, -EN_SUFFIX.length)}.stujo.net`;
    const path = hasEnPrefix(pathname) ? pathname : `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(`https://${newHost}${path}${req.nextUrl.search}`, 301);
  }

  // 3) Legacy job detail — SLUG-BEARING only: /stellenangebote/:oldId-:slug.
  //    Old Rails links carry a slug; this app emits bare-id URLs. Because old
  //    Rails ids overlap the new Postgres PK range, redirecting a bare id would
  //    wrongly bounce a valid *new* page (its number may match some job's
  //    legacyStujoId), so only the slugged — unambiguously legacy — shape is
  //    acted on. An unknown id falls through to the normal 404.
  const jobMatch = redirectHost && pathname.match(/^\/stellenangebote\/(\d+)-[^/]+$/);
  if (jobMatch) {
    const newId = await lookupNewJobId(Number(jobMatch[1]));
    if (newId) {
      const target = absoluteUrl(req, redirectHost, `${prefix}/stellenangebote/${newId}`);
      return NextResponse.redirect(target, 301);
    }
  }

  return NextResponse.next();
}
