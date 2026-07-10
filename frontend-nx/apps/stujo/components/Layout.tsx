import Head from 'next/head';
import Link from 'next/link';
import { FC, PropsWithChildren } from 'react';
import { useTranslations } from 'next-intl';

import type { PortalBranding } from '../lib/portal';

/**
 * Portal-branded page frame. Branding values come from AppSettings (per
 * portal) and are injected as CSS variables, so the design port only has
 * to style against --stujo-primary / --stujo-secondary.
 */
const Layout: FC<PropsWithChildren<{ portal: PortalBranding }>> = ({ portal, children }) => {
  const t = useTranslations('common');

  const styleVars = [
    portal.primaryColor ? `--stujo-primary: ${portal.primaryColor};` : '',
    portal.secondaryColor ? `--stujo-secondary: ${portal.secondaryColor};` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <Head>
        <title>{portal.title}</title>
        {portal.faviconUrl && <link rel="icon" href={portal.faviconUrl} />}
        {styleVars && <style>{`:root { ${styleVars} }`}</style>}
      </Head>
      <header className="stujo-header">
        <div className="stujo-container">
          <Link href="/">
            {portal.logoUrl ? (
              <img src={portal.logoUrl} alt={portal.title} style={{ height: '2rem' }} />
            ) : (
              portal.title
            )}
          </Link>
          <Link href="/stellenangebote">{t('jobs')}</Link>
          <Link href="/fuer-arbeitgeber">{t('forEmployers')}</Link>
          <Link href="/mein-stujo">Mein StuJo</Link>
        </div>
      </header>
      <main className="stujo-container" style={{ padding: '1.5rem 1rem' }}>
        {children}
      </main>
      <footer className="stujo-container stujo-muted" style={{ padding: '2rem 1rem' }}>
        {portal.imprintUrl && <a href={portal.imprintUrl}>Impressum</a>}{' '}
        {portal.privacyUrl && <a href={portal.privacyUrl}>Datenschutz</a>}
      </footer>
    </>
  );
};

export default Layout;
