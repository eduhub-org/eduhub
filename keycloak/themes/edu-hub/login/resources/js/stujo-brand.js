/*
 * Switches the shared login theme to StuJo branding when the auth request
 * comes from the StuJo app. The initial /protocol/openid-connect/auth URL
 * carries the redirect_uri; follow-up pages (failed login, registration)
 * don't, so the decision is remembered in sessionStorage for the flow.
 */
(function () {
  var isStujo = false;
  try {
    var redirect = new URLSearchParams(window.location.search).get('redirect_uri') || '';
    if (redirect) {
      isStujo = /stujo|localhost:5001|127\.0\.0\.1:5001/i.test(redirect);
      sessionStorage.setItem('kc-app-brand', isStujo ? 'stujo' : 'eduhub');
    } else {
      isStujo = sessionStorage.getItem('kc-app-brand') === 'stujo';
    }
  } catch (e) {
    /* storage unavailable — keep default branding */
  }
  if (isStujo) {
    document.documentElement.classList.add('stujo-brand');
  }
})();
