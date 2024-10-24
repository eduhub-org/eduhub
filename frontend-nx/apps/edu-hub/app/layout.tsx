import { Providers } from './providers';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import useTranslation from 'next-translate/useTranslation';
import log from 'loglevel';

import FacebookPixel from '../components/common/FacebookPixel';
import Cookiebot from '../components/common/Cookiebot';
import ClientLocaleProvider from '../components/common/ClientLocaleProvider';

import '../styles/globals.css';
import i18n from '../i18n';

export const metadata: Metadata = {
  title: 'EduHub | opencampus.sh',
  description: 'EduHub by opencampus.sh',
  viewport: 'width=device-width, initial-scale=1',
};

if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  log.setLevel('warn'); // Show only warnings and errors in production.
} else {
  log.setLevel('debug'); // Show all log levels in development.
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useTranslation('common');

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
        <FacebookPixel />
        <Cookiebot />
      </head>
      <body>
        <ClientLocaleProvider />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
