'use client';

import { SessionProvider } from 'next-auth/react';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppSettingsProvider } from '../contexts/AppSettingsContext';
import { client } from '../config/apollo';

const theme = createTheme();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        <ThemeProvider theme={theme}>
          <AppSettingsProvider>{children}</AppSettingsProvider>
        </ThemeProvider>
      </ApolloProvider>
    </SessionProvider>
  );
}
