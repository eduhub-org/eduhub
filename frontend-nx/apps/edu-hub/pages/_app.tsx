import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import type { AppContext, AppProps } from 'next/app';
import { FC, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import * as fbq from '../lib/fpixel';

import { registerLocale, setDefaultLocale } from 'react-datepicker';
import de from 'date-fns/locale/de';
import en from 'date-fns/locale/en-US';
import useTranslation from 'next-translate/useTranslation';

registerLocale('de', de);
registerLocale('en', en);

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

  useEffect(() => {
    // This pageview only triggers the first time (it's important for Pixel to have real information)
    fbq.pageview();

    const handleRouteChange = () => {
      fbq.pageview();
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
        {/* Global Site Code Pixel - Facebook Pixel */}
        <Script
          defer
          id="fb-pixel"
          strategy="afterInteractive"
          data-cookieconsent="marketing"
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
          defer
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="718dfb5e-b62c-4993-9c65-99ae483f5510"
          data-blockingmode="auto"
          type="text/javaScript"
        />
        <Component {...pageProps} />
      </ApolloProvider>
    </SessionProvider>
  );
};

export default MyApp;
