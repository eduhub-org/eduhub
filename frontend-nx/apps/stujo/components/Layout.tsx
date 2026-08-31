import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, signOut, useSession } from 'next-auth/react';
import { FC, PropsWithChildren, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import type { PortalBranding } from '../lib/portal';
import StuJoLegacyIcon from './StuJoLegacyIcon';

interface LayoutProps extends PropsWithChildren {
  fullWidthMain?: boolean;
  portal: PortalBranding;
}

/**
 * Portal-branded page frame, ported from the live stujo.net layout:
 * purple gradient banner with logo + diagonal art, green uppercase nav
 * bar, gradient four-column footer. Branding values come from AppSettings
 * (per portal) and are injected as CSS variables, so campus portals can
 * override --stujo-primary / --stujo-secondary.
 */
const Layout: FC<LayoutProps> = ({ children, fullWidthMain = false, portal }) => {
  const t = useTranslations('common');
  const tLayout = useTranslations('common.Layout');
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Keycloak end-session logout, same flow as the edu-hub app: fetch the
  // end-session URL, clear the NextAuth session, then redirect through
  // Keycloak back to the app.
  const logout = useCallback(async () => {
    const res = await fetch('/api/auth/logout');
    const jsonPayload = await res.json();
    const url = JSON.parse(jsonPayload).url;
    await signOut({ redirect: false });
    router.push(url);
  }, [router]);

  // Login/registration use the standard OIDC full-page redirect. Keycloak
  // and the portal will live on different domains in production, where
  // popup/iframe flows break on third-party-cookie blocking. `prompt=create`
  // deep-links into Keycloak's registration form (Keycloak 22+); afterwards
  // the user returns to the page they started from.
  //
  // `stujo_portal` is read by the Keycloak theme so campus
  // white-labels get the right skin even when NEXTAUTH_URL is a shared host
  // (local multi-hostname /etc/hosts setup) and redirect_uri is localhost.
  const login = useCallback(
    (register: boolean) =>
      signIn('keycloak', { callbackUrl: router.asPath }, {
        stujo_portal: portal.appName,
        ...(register ? { prompt: 'create' } : {}),
      }),
    [portal.appName, router.asPath]
  );

  const styleVars = [
    portal.primaryColor ? `--stujo-primary: ${portal.primaryColor};` : '',
    // The header/footer gradient runs dark → primary → dark. The Rails
    // campus themes each define their own dark end; ~45% primary over
    // black reproduces all of them within a couple of RGB points.
    portal.primaryColor
      ? `--stujo-gradient-dark: color-mix(in srgb, ${portal.primaryColor} 45%, black);`
      : '',
    portal.secondaryColor ? `--stujo-secondary: ${portal.secondaryColor};` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const navClass = (path: string) =>
    router.pathname === path || router.pathname.startsWith(`${path}/`)
      ? 'stujo-nav--active'
      : undefined;

  // Legal pages are not part of the job-board migration (yet); fall back to
  // the live stujo.net pages unless the portal configures its own URLs.
  const imprintUrl = portal.imprintUrl || 'https://www.stujo.net/impressum';
  const privacyUrl = portal.privacyUrl || 'https://www.stujo.net/datenschutz';
  const termsUrl = portal.termsUrl || '/agb';
  const isGerman = router.locale === 'de';
  const otherLocale = isGerman ? 'en' : 'de';

  return (
    <>
      <Head>
        <title>{portal.title}</title>
        <link rel="icon" href={portal.faviconUrl || '/favicon.ico'} />
        {/* :root:root outranks the globals.css defaults regardless of
            where the runtime injects the compiled stylesheet. */}
        {styleVars && <style>{`:root:root { ${styleVars} }`}</style>}
      </Head>
      <header className="stujo-header">
        <img src="/stujo_header_diag.png" alt="" className="stujo-header-diag" />
        <Link href="/">
          <img
            src={portal.logoUrl || '/stujo_header_logo.png'}
            alt={portal.title}
            className="stujo-header-logo"
          />
        </Link>
        <nav className="stujo-header-topnav">
          <span className="stujo-lang-switch">
            <Link
              href={router.asPath}
              locale="de"
              className={router.locale === 'de' ? 'stujo-lang--active' : undefined}
              aria-current={router.locale === 'de' ? 'page' : undefined}
            >
              DE
            </Link>
            <Link
              href={router.asPath}
              locale={otherLocale}
              className="stujo-lang-toggle"
              aria-label={tLayout(isGerman ? 'switch_to_english' : 'switch_to_german')}
            >
              <img src={isGerman ? '/icons/language-switch-left.png' : '/icons/language-switch-right.png'} alt="" />
            </Link>
            <Link
              href={router.asPath}
              locale="en"
              className={router.locale === 'en' ? 'stujo-lang--active' : undefined}
              aria-current={router.locale === 'en' ? 'page' : undefined}
            >
              EN
            </Link>
          </span>
          {sessionStatus === 'authenticated' ? (
            <a
              href="/api/auth/logout"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
              className="stujo-header-action stujo-header-action--uppercase"
            >
              <StuJoLegacyIcon name="unlocked" className="stujo-header-action-icon" />
              {t('logout')}
            </a>
          ) : (
            <>
              <a
                href="/api/auth/signin"
                onClick={(e) => {
                  e.preventDefault();
                  login(true);
                }}
                className="stujo-header-action stujo-header-action--uppercase"
              >
                <StuJoLegacyIcon name="plus" className="stujo-header-action-icon" />
                {t('register')}
              </a>
              <a
                href="/api/auth/signin"
                onClick={(e) => {
                  e.preventDefault();
                  login(false);
                }}
                className="stujo-header-action stujo-header-action--uppercase"
              >
                <StuJoLegacyIcon name="unlocked" className="stujo-header-action-icon" />
                {t('login')}
              </a>
            </>
          )}
        </nav>
      </header>
      <nav className="stujo-nav">
        <div className="stujo-container stujo-nav-inner">
          <Link href="/" className={`stujo-nav-home ${navClass('/') ?? ''}`} aria-label={tLayout('home')}>
            <StuJoLegacyIcon name="home" className="stujo-nav-home-icon" />
          </Link>
          <Link href="/stellenangebote" className={navClass('/stellenangebote')}>
            {t('jobs')}
          </Link>
          <Link href="/fuer-arbeitgeber" className={navClass('/fuer-arbeitgeber')}>
            {t('employers')}
          </Link>
          <Link href="/mein-stujo" className={navClass('/mein-stujo')}>
            Mein StuJo
          </Link>
        </div>
      </nav>
      <main className={fullWidthMain ? 'stujo-main stujo-main--full-width' : 'stujo-container stujo-main'}>
        {children}
      </main>
      <footer className="stujo-footer">
        <div className="stujo-container stujo-footer-cols">
          <div>
            <h3>{t('footerAboutHead')}</h3>
            <p>{t('footerAboutText')}</p>
          </div>
          <div className="stujo-footer-links">
            <h3>{t('footerLinksHead')}</h3>
            <a href={termsUrl}>AGB</a>
            <Link href="/fuer-arbeitgeber">{t('footerPrices')}</Link>
            <a href="https://www.stujo.net/faq">FAQ</a>
            <a href={imprintUrl}>Impressum</a>
            <a href={privacyUrl}>Datenschutz</a>
          </div>
          <div>
            <h3>{t('footerUniversityPartners')}</h3>
            <a className="stujo-footer-logo-link" href="http://www.uni-kiel.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/uni-kiel-logo-norm-228x76.gif" alt="Universität Kiel" />
            </a>
            <a className="stujo-footer-logo-link" href="http://www.haw-kiel.de" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/Logo_HAW_Kiel.jpg" alt="HAW Kiel" />
            </a>
            <a className="stujo-footer-logo-link" href="http://campuscareer.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/logo_flensburg.png" alt="Campus Flensburg" />
            </a>
          </div>
          <div>
            <h3>{t('footerPartners')}</h3>
            <a className="stujo-footer-logo-link" href="http://www.wissenschaftszentrumkiel.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/Logo-Wissenschaftszentrum.png" alt="Wissenschaftszentrum Kiel" />
            </a>
            <a className="stujo-footer-logo-link" href="https://www.opencampus.sh/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/cbb.png" alt="Campus Business Box e.V." />
            </a>
            <a className="stujo-footer-logo-link" href="http://www.kielregion.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/KielRegion.jpg" alt="Kiel Region" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;
