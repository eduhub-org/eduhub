import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import type { AppContext, AppProps } from 'next/app';
import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import * as fbq from '../lib/fpixel';
import { AppCacheProvider } from '@mui/material-nextjs/v15-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import { NextIntlClientProvider } from 'next-intl';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';

import { AppSettingsProvider } from '../contexts/AppSettingsContext';
import { AuthErrorProvider } from '../contexts/AuthErrorContext';
import { AuthStoreUpdater } from '../components/AuthStoreUpdater';

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

// @ts-expect-error Typing does not work correctly here because of getInitialProps
const MyApp: FC<AppProps & InitialProps> & {
  getInitialProps: (ctx: AppContext) => Promise<Record<string, unknown>>;
} = ({ Component, pageProps }) => {
  const router = useRouter();
  const locale = router.locale || 'de';

  useEffect(() => {
    setDefaultLocale(locale);
  }, [locale]);

  const [isFBPixelLoaded, setFBPixelLoaded] = useState(false);

  useEffect(() => {
    if (isFBPixelLoaded && typeof window.fbq === 'function') {
      // This pageview only triggers the first time
      fbq.pageview();

      const handleRouteChange = () => {
        fbq.pageview();
      };

      router.events.on('routeChangeComplete', handleRouteChange);
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
      };
    }
    return undefined;
  }, [router.events, isFBPixelLoaded]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Europe/Berlin">
      <SessionProvider session={pageProps.session}>
        <AuthStoreUpdater />
        <ApolloProvider client={client}>
          <AppCacheProvider {...pageProps}>
            <ThemeProvider theme={theme}>
              <AuthErrorProvider>
                <AppSettingsProvider>
                  {/* Global Site Code Pixel - Facebook Pixel */}
                  <Script
                    id="fb-pixel"
                    data-cookieconsent="marketing"
                    strategy="afterInteractive"
                    type="text/plain"
                    onLoad={() => setFBPixelLoaded(true)}
                    dangerouslySetInnerHTML={{
                      __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1775867059535400');
              fbq('track', 'PageView');
            `,
                    }}
                  />

                  <Script
                    id="plausible-analytics"
                    data-domain="edu.opencampus.sh"
                    src="https://plausible.io/js/script.js"
                    strategy="afterInteractive"
                    data-cookieconsent="statistics"
                    type="text/plain"
                  />
                  <Head>
                    <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                  </Head>
                  <Component {...pageProps} />
                </AppSettingsProvider>
              </AuthErrorProvider>
            </ThemeProvider>
          </AppCacheProvider>
        </ApolloProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
};

export default MyApp;
