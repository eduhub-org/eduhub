/**
 * Legacy StuJo → EduHub cutover redirects (plan §7.3 step 4).
 *
 * Preserves inbound links / SEO from the Rails site after DNS moves to this
 * app. Three cases:
 *   1. `*.en.stujo.net/<path>` → `<portal>.stujo.net/en/<path>` (host-based
 *      locale of the Rails app → next-intl path locale). Pure string rewrite.
 *   2. `/stellenangebote/:oldId(-slug)` → `/stellenangebote/:newId`. The old
 *      Rails job id is resolved via JobPosting.legacyStujoId to the new PK the
 *      detail page keys on (see lib/jobs.ts `fetchJobDetail`).
 *   3. `/arbeitgeber/:oldId-:slug` → new employer page — NOT wired yet: that
 *      route does not exist (plan §8.2). The resolver is ready in
 *      lib/legacyRedirects.ts; enable this block once /arbeitgeber lands.
 *
 * All redirects are 301 (permanent) as the plan specifies — note Next's
 * `{ permanent: true }` helper emits 308, so we set the status explicitly here.
 * The job lookup only runs on legacy-shaped URLs, so new-id traffic is untouched.
 */
import { NextRequest, NextResponse } from 'next/server';
import { lookupNewJobId } from './lib/legacyRedirects';

export const config = {
  // Run on page routes only — skip Next internals, the API, and static assets
  // (anything with a file extension).
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};

const EN_SUFFIX = '.en.stujo.net';

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const hostname = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // 1) Host-based locale: *.en.stujo.net → <portal>.stujo.net/en/...
  if (hostname === 'en.stujo.net' || hostname.endsWith(EN_SUFFIX)) {
    const newHost =
      hostname === 'en.stujo.net'
        ? 'stujo.net'
        : `${hostname.slice(0, -EN_SUFFIX.length)}.stujo.net`;
    const target = req.nextUrl.clone();
    target.protocol = 'https:';
    target.host = newHost;
    if (!pathname.startsWith('/en')) {
      target.pathname = pathname === '/' ? '/en' : `/en${pathname}`;
    }
    return NextResponse.redirect(target, 301);
  }

  // 2) Legacy job detail: /stellenangebote/:oldId(-slug) → /stellenangebote/:newId
  //    (matched anywhere in the path so an optional /de|/en locale prefix is kept)
  const jobMatch = pathname.match(/(^|\/(?:de|en))\/stellenangebote\/(\d+)(?:-[^/]*)?$/);
  if (jobMatch) {
    const legacyId = Number(jobMatch[2]);
    const newId = await lookupNewJobId(legacyId);
    if (newId && newId !== legacyId) {
      const target = req.nextUrl.clone();
      target.pathname = pathname.replace(
        /(\/stellenangebote\/)\d+(?:-[^/]*)?$/,
        `$1${newId}`
      );
      return NextResponse.redirect(target, 301);
    }
  }

  // 3) Legacy employer pages: /arbeitgeber/:oldId-:slug
  //    TODO(cutover): enable once the /arbeitgeber route exists (plan §8.2):
  //      const m = pathname.match(/\/arbeitgeber\/(\d+-[^/]*)$/);
  //      if (m) { const id = await lookupNewOrgIdByLegacySlug(m[1]); ... 301 }
  //    Until then, fall through (same 404 as today) rather than redirect nowhere.

  return NextResponse.next();
}
