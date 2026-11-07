import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import type { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import { FC, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import { NextIntlClientProvider } from 'next-intl';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';

import { AppSettingsProvider } from '../contexts/AppSettingsContext';
import { AuthErrorProvider } from '../contexts/AuthErrorContext';
import { AuthStoreUpdater } from '../components/AuthStoreUpdater';
import { ImpersonationProvider } from '../contexts/ImpersonationContext';
import { ParticipantPreviewProvider } from '../contexts/ParticipantPreviewContext';
import { useHasElevatedSessionRole, useIsSessionLoading } from '../hooks/authentication';

// Import locale messages
import deMessages from '../locales/de.json';
import enMessages from '../locales/en.json';

const messages: Record<string, Record<string, unknown>> = {
  de: deMessages,
  en: enMessages,
};

registerLocale('de', de);
registerLocale('en', enUS);

import log from 'loglevel';
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  log.setLevel('warn'); // Show only warnings and errors in production.
} else {
  log.setLevel('debug'); // Show all log levels in development.
}

import { client } from '../config/apollo';
import { theme } from '../config/theme';

import '../styles/globals.css';
import '../styles/widget.css';

interface InitialProps {
  cookies: unknown;
}

// Must be rendered as a descendant of SessionProvider - useSession() reads
// context provided by the SessionProvider element in MyApp's own return
// value, which isn't visible to hooks called in MyApp's own render.
const PlausibleAnalytics: FC = () => {
  // Deliberately the session's own roles rather than useIsAdmin/useIsOrgAdmin:
  // those report false while the admin views the app as someone else, and by
  // the very reason below, letting the tag in for an impersonation would leave
  // it in the document afterwards too.
  const hasElevatedRole = useHasElevatedSessionRole();
  const isSessionLoading = useIsSessionLoading();
  // Hold off rendering the script until the session resolves - next/script never
  // removes an already-inserted <script> tag on unmount, so mounting it first and
  // hiding it once the admin/org_admin role arrives would not stop it from firing.
  const canLoadPlausible = !isSessionLoading && !hasElevatedRole;

  if (!canLoadPlausible) {
    return null;
  }

  return (
    <Script
      id="plausible-analytics"
      data-domain="edu.opencampus.sh"
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
};

// @ts-expect-error Typing does not work correctly here because of getInitialProps
const MyApp: FC<AppProps & InitialProps> & {
  getInitialProps: (ctx: AppContext) => Promise<Record<string, unknown>>;
} = ({ Component, pageProps }) => {
  const router = useRouter();
  const locale = router.locale || 'de';

  useEffect(() => {
    setDefaultLocale(locale);
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Europe/Berlin">
      <SessionProvider session={pageProps.session}>
        {/* Above AuthStoreUpdater and everything else that asks "who am I":
            while a super-admin impersonates someone, this provider is what all
            of those answers come from. */}
        <ImpersonationProvider>
        <AuthStoreUpdater />
        <ApolloProvider client={client}>
          <AppCacheProvider {...pageProps}>
            <ThemeProvider theme={theme}>
              <AuthErrorProvider>
                <AppSettingsProvider>
                <ParticipantPreviewProvider>
                  {/* Skip loading Plausible entirely for admins/org admins so their own usage never counts as traffic */}
                  <PlausibleAnalytics />
                  <Head>
                    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                  </Head>
                  <Component {...pageProps} />
                </ParticipantPreviewProvider>
                </AppSettingsProvider>
              </AuthErrorProvider>
            </ThemeProvider>
          </AppCacheProvider>
        </ApolloProvider>
        </ImpersonationProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
};

export default MyApp;
