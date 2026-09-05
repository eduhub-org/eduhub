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
 *   1. Interim `*.opencampus.sh` production hosts → their `stujo.net`
 *      equivalents, so stujo.net is the single canonical domain. Gated on
 *      STUJO_CANONICAL_REDIRECTS so pre-cutover QA on the interim hosts keeps
 *      working, and staging (which never sets it) is never affected.
 *   2. `*.en.stujo.net/<path>` → `<portal>.stujo.net/en/<path>` (the Rails
 *      app's host-based locale → the next i18n path locale).
 *   3. `/stellenangebote/:oldId-:slug` → `/stellenangebote/:newId`, resolving
 *      the old Rails id through JobPosting.legacyStujoId.
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
 * Runtime flag (set on the Cloud Run service by Terraform, see
 * infrastructure/application/09_stujo_net.tf). Read per request rather than at
 * module load so a revision that only changes the env var takes effect without
 * a rebuild — the flag must not turn on before stujo.net actually serves.
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
 * The host comes from the request, and the scheme from the load balancer's
 * `x-forwarded-proto` (with the request's own scheme as the local-dev
 * fallback, so http://localhost:5001 keeps working).
 */
const absoluteUrl = (req: NextRequest, host: string, path: string) => {
  const forwardedProto = (req.headers.get('x-forwarded-proto') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.nextUrl.protocol.replace(':', '');
  return `${protocol}://${host}${path}${req.nextUrl.search}`;
};

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const hostWithPort = req.headers.get('host') || req.nextUrl.host;
  const hostname = hostWithPort.split(':')[0].toLowerCase();
  // With the pages-router i18n config, Next normalizes the locale out of
  // `pathname` and exposes it as `nextUrl.locale`.
  const { pathname } = req.nextUrl;
  const prefix = localePrefix(req.nextUrl.locale);

  // 1) Canonicalize the interim opencampus.sh hosts → stujo.net (path, locale
  //    prefix and query kept). Always https: the canonical domain is.
  const canonicalHost = CANONICAL_HOSTS[hostname];
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
  const jobMatch = pathname.match(/^\/stellenangebote\/(\d+)-[^/]+$/);
  if (jobMatch) {
    const newId = await lookupNewJobId(Number(jobMatch[1]));
    if (newId) {
      const target = absoluteUrl(req, hostWithPort, `${prefix}/stellenangebote/${newId}`);
      return NextResponse.redirect(target, 301);
    }
  }

  return NextResponse.next();
}
