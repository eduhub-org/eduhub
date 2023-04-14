import { ApolloProvider } from '@apollo/client';
import { SessionProvider } from 'next-auth/react';
import type { AppContext, AppProps } from 'next/app';
import { FC } from 'react';

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
  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SessionProvider>
  );
};

export default MyApp;
