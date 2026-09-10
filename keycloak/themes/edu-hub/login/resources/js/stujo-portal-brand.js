/*
 * Adds StuJo (or white-label campus portal) co-branding to the shared login
 * theme when the auth request comes from a StuJo app. The page stays the
 * EduHub login on purpose — StuJo and EduHub are one account, and a
 * StuJo-only skin made people register a second time. Brand is resolved
 * from (in order):
 *   1. `stujo_portal` query param (passed by the StuJo app via NextAuth
 *      authorization params — reliable for local multi-hostname setups
 *      where NEXTAUTH_URL / redirect_uri stay on localhost)
 *   2. `redirect_uri` hostname (works when each portal has its own
 *      NEXTAUTH_URL, e.g. staging Cloud Run services)
 *   3. sessionStorage (follow-up pages like failed login / registration
 *      drop the original query string)
 *
 * Brand values: eduhub | stujo | stujo-haw-kiel | stujo-flensburg
 * (CAU uses the root StuJo look, same as stujo.net.)
 */
(function () {
  var BRAND_KEY = 'kc-app-brand';
  var brand = 'eduhub';

  function normalizeBrand(value) {
    if (!value) return null;
    var v = String(value).toLowerCase();
    if (v === 'stujo-haw-kiel' || v === 'stujo-flensburg') return v;
    // Root StuJo, CAU, or any other stujo-* portal → default StuJo skin.
    if (v === 'stujo' || v.indexOf('stujo') === 0) return 'stujo';
    return null;
  }

  function brandFromRedirect(redirect) {
    if (!redirect) return null;
    var host = '';
    try {
      host = new URL(redirect).hostname.toLowerCase();
    } catch (e) {
      host = redirect.toLowerCase();
    }
    // Campus white-labels first (more specific hostname patterns).
    if (/haw-kiel|fh-kiel/.test(host)) return 'stujo-haw-kiel';
    if (/flensburg/.test(host)) return 'stujo-flensburg';
    // Root StuJo + CAU + local stujo dev server.
    if (/stujo|localhost:5001|127\.0\.0\.1:5001/.test(redirect)) return 'stujo';
    return 'eduhub';
  }

  try {
    var params = new URLSearchParams(window.location.search);
    var portalParam = normalizeBrand(params.get('stujo_portal'));
    var redirect = params.get('redirect_uri') || '';

    if (portalParam) {
      brand = portalParam;
      sessionStorage.setItem(BRAND_KEY, brand);
    } else if (redirect) {
      brand = brandFromRedirect(redirect) || 'eduhub';
      sessionStorage.setItem(BRAND_KEY, brand);
    } else {
      brand = sessionStorage.getItem(BRAND_KEY) || 'eduhub';
    }
  } catch (e) {
    /* storage unavailable — keep default branding */
  }

  if (brand === 'eduhub') return;

  // Shared StuJo co-brand + optional campus override class.
  document.documentElement.classList.add('stujo-brand');
  if (brand === 'stujo-haw-kiel' || brand === 'stujo-flensburg') {
    document.documentElement.classList.add(brand);
  }
})();
