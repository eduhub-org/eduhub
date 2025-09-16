'use client';

import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SessionProvider } from 'next-auth/react';
import { ApolloProvider } from '@apollo/client';

import { client } from '../config/apollo';

const theme = createTheme();

type Props = {
  children: ReactNode;
  locale: string;
  messages: any;
};

export function Providers({ children, locale, messages }: Props) {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <NextIntlClientProvider 
              locale={locale} 
              messages={messages}
              timeZone="Europe/Berlin"
            >
                {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
