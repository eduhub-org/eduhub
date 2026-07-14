import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Shared infrastructure reused from the edu-hub app (via the @eduhub/*
// tsconfig alias + externalDir) until it is extracted into root libs/.
import { client } from '@eduhub/config/apollo';
import { AuthStoreUpdater } from '@eduhub/components/AuthStoreUpdater';

import deMessages from '../locales/de.json';
import enMessages from '../locales/en.json';

import '../styles/globals.css';

const messages: Record<string, Record<string, unknown>> = {
  de: deMessages,
  en: enMessages,
};

export default function StujoApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const locale = router.locale || 'de';

  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
        <AuthStoreUpdater />
        <NextIntlClientProvider
          locale={locale}
          messages={messages[locale] ?? messages.de}
          timeZone="Europe/Berlin"
        >
          <Head>
            <title>StuJo – Studentenjobs in Schleswig-Holstein</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </Head>
          <Component {...pageProps} />
        </NextIntlClientProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
