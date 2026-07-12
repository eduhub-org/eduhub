import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getSession, signIn, signOut, useSession } from 'next-auth/react';
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { PortalBranding } from '../lib/portal';

/**
 * Portal-branded page frame, ported from the live stujo.net layout:
 * purple gradient banner with logo + diagonal art, green uppercase nav
 * bar, gradient four-column footer. Branding values come from AppSettings
 * (per portal) and are injected as CSS variables, so campus portals can
 * override --stujo-primary / --stujo-secondary.
 */
const Layout: FC<PropsWithChildren<{ portal: PortalBranding }>> = ({ portal, children }) => {
  const t = useTranslations('common');
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

  // Login/registration open as a centered dialog window over the current
  // page (dimmed backdrop) instead of a full-page redirect. A popup keeps
  // Keycloak's cookies first-party, which an in-page iframe would not
  // (stujo.net and Keycloak are cross-site in production). Falls back to
  // the classic redirect when the popup is blocked.
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  const authPopupRef = useRef<Window | null>(null);

  const closeAuthPopup = useCallback(() => {
    authPopupRef.current?.close();
    authPopupRef.current = null;
    setAuthPopupOpen(false);
  }, []);

  const openAuthPopup = useCallback(
    (register: boolean) => {
      const width = 480;
      const height = 720;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      const popup = window.open(
        `/auth/popup${register ? '?register=1' : ''}`,
        'stujo-auth',
        `popup=yes,width=${width},height=${height},left=${left},top=${top}`
      );
      if (!popup) {
        signIn('keycloak', { callbackUrl: router.asPath });
        return;
      }
      authPopupRef.current = popup;
      setAuthPopupOpen(true);
    },
    [router.asPath]
  );

  useEffect(() => {
    if (!authPopupOpen) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data === 'stujo:auth-complete') {
        getSession(); // refresh the opener's session immediately
        closeAuthPopup();
      }
    };
    window.addEventListener('message', onMessage);
    const watcher = window.setInterval(() => {
      if (authPopupRef.current?.closed) {
        getSession();
        closeAuthPopup();
      }
    }, 500);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(watcher);
    };
  }, [authPopupOpen, closeAuthPopup]);

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
            >
              DE
            </Link>
            <span aria-hidden="true">|</span>
            <Link
              href={router.asPath}
              locale="en"
              className={router.locale === 'en' ? 'stujo-lang--active' : undefined}
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
            >
              {t('logout')}
            </a>
          ) : (
            <>
              <a
                href="/auth/popup?register=1"
                onClick={(e) => {
                  e.preventDefault();
                  openAuthPopup(true);
                }}
              >
                + {t('register')}
              </a>
              <a
                href="/auth/popup"
                onClick={(e) => {
                  e.preventDefault();
                  openAuthPopup(false);
                }}
              >
                {t('login')}
              </a>
            </>
          )}
        </nav>
      </header>
      <nav className="stujo-nav">
        <div className="stujo-container stujo-nav-inner">
          <Link href="/" className={`stujo-nav-home ${navClass('/') ?? ''}`} aria-label="Home">
            <img src="/icons/home.png" alt="" />
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
      {authPopupOpen && (
        <div
          className="stujo-auth-backdrop"
          onClick={() => authPopupRef.current?.focus()}
          role="dialog"
          aria-label={t('login')}
        >
          <div className="stujo-auth-backdrop-card" onClick={(e) => e.stopPropagation()}>
            <p>Die Anmeldung ist im geöffneten Fenster fortzusetzen.</p>
            <button className="stujo-btn stujo-btn--ghost" onClick={closeAuthPopup}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
      <main className="stujo-container" style={{ padding: '1.5rem 1rem', minHeight: '40vh' }}>
        {children}
      </main>
      <footer className="stujo-footer">
        <div className="stujo-container stujo-footer-cols">
          <div>
            <h3>{t('footerAboutHead')}</h3>
            <p>{t('footerAboutText')}</p>
          </div>
          <div>
            <h3>{t('footerLinksHead')}</h3>
            <a href="https://www.stujo.net/agb">AGB</a>
            <Link href="/fuer-arbeitgeber">{t('footerPrices')}</Link>
            <a href="https://www.stujo.net/faq">FAQ</a>
            <a href={imprintUrl}>Impressum</a>
            <a href={privacyUrl}>Datenschutz</a>
          </div>
          <div>
            <h3>{t('footerUniversityPartners')}</h3>
            <a href="http://www.uni-kiel.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/uni-kiel-logo-norm-228x76.gif" alt="Universität Kiel" />
            </a>
            <a href="http://www.haw-kiel.de" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/Logo_HAW_Kiel.jpg" alt="HAW Kiel" />
            </a>
            <a href="http://campuscareer.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/logo_flensburg.png" alt="Campus Flensburg" />
            </a>
          </div>
          <div>
            <h3>{t('footerPartners')}</h3>
            <a href="http://www.wissenschaftszentrumkiel.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/Logo-Wissenschaftszentrum.png" alt="Wissenschaftszentrum Kiel" />
            </a>
            <a href="https://www.opencampus.sh/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/cbb.png" alt="Campus Business Box e.V." />
            </a>
            <a href="http://www.kielregion.de/" target="_blank" rel="noreferrer">
              <img className="stujo-footer-logo" src="/partner/KielRegion.jpg" alt="Kiel Region" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Layout;
