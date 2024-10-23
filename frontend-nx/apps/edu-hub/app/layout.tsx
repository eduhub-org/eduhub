import { FC, useEffect, useState } from 'react';
import { Providers } from './providers';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/router';
import Script from 'next/script';
import useTranslation from 'next-translate/useTranslation';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';
import log from 'loglevel';

import * as fbq from '../lib/fpixel';
import '../styles/globals.css';
import i18n from '../i18n';

export const metadata: Metadata = {
  title: 'EduHub | opencampus.sh',
  description: 'EduHub by opencampus.sh',
  viewport: 'width=device-width, initial-scale=1',
};

registerLocale('de', de);
registerLocale('en', enUS);


if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  log.setLevel('warn'); // Show only warnings and errors in production.
} else {
  log.setLevel('debug'); // Show all log levels in development.
}

import '../styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useTranslation('common');

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

  // Redirect to default locale if lang is not supported. /second-page -> /en/second-page
  if (!i18n.locales.includes(lang)) redirect(`/${i18n.defaultLocale}/${lang}`);

  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@100;200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <noscript>
          <img
            height="1"
            width="1"
            alt="fb pixel id image"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=1775867059535400&ev=PageView&noscript=1`}
          />
        </noscript>
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="718dfb5e-b62c-4993-9c65-99ae483f5510"
          data-blockingmode="auto"
          strategy="beforeInteractive"
          type="text/javaScript"
        />
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
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
