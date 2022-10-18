import { IncomingMessage } from "http";

import { ApolloProvider } from "@apollo/client";
import { SessionProvider } from "next-auth/react";
import { appWithTranslation } from "next-i18next";
import type { AppContext, AppProps } from "next/app";
import { FC } from "react";

import { client } from "../config/apollo";

import "../styles/globals.css";

interface InitialProps {
  cookies: unknown;
}

// @ts-expect-error Typing does not work correctly here because of getInitialProps
const MyApp: FC<AppProps & InitialProps> & {
  getInitialProps: (ctx: AppContext) => Promise<Record<string, unknown>>;
} = ({ Component, pageProps, cookies }) => {
  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SessionProvider>
  );
};

export default appWithTranslation(MyApp);
