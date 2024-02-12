import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import type { AppContext, AppProps } from 'next/app';
import { FC, useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import * as fbq from '../lib/fpixel';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
import en from 'date-fns/locale/en-US';
import useTranslation from 'next-translate/useTranslation';

registerLocale('de', de);
registerLocale('en', en);

import log from 'loglevel';
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  log.setLevel('warn'); // Show only warnings and errors in production.
} else {
  log.setLevel('debug'); // Show all log levels in development.
}

import { client } from '../config/apollo';

import '../styles/globals.css';

interface InitialProps {
  cookies: unknown;
}

// @ts-expect-error Typing does not work correctly here because of getInitialProps
const MyApp: FC<AppProps & InitialProps> & {
  getInitialProps: (ctx: AppContext) => Promise<Record<string, unknown>>;
} = ({ Component, pageProps, cookies }) => {
  const { lang } = useTranslation();
  setDefaultLocale(lang);

  const router = useRouter();

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
  }, [router.events, isFBPixelLoaded]);

  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
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
        <Component {...pageProps} />
      </ApolloProvider>
    </SessionProvider>
  );
};

export default MyApp;
