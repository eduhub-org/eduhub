import { IncomingMessage } from "http";

import { ApolloProvider } from "@apollo/client";
import { SSRCookies, SSRKeycloakProvider } from "@react-keycloak/ssr";
import cookie from "cookie";
import { appWithTranslation } from "next-i18next";
import type { AppContext, AppProps } from "next/app";
import { FC } from "react";

import { client } from "../config/apollo";

import "../styles/globals.css";

const keycloakCfg = {
  realm: "edu-hub",
  url: process.env.NEXT_PUBLIC_AUTH_URL,
  clientId: "hasura",
};

interface InitialProps {
  cookies: unknown;
}

const MyApp: FC<AppProps & InitialProps> & {
  getInitialProps: (ctx: AppContext) => Promise<Record<string, unknown>>;
} = ({ Component, pageProps, cookies }) => {

  console.log("Will use keycloakCfg", keycloakCfg);

  return (
    <SSRKeycloakProvider
      keycloakConfig={keycloakCfg}
      persistor={SSRCookies(cookies)}
    >
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SSRKeycloakProvider>
  );
};

const parseCookies = (req?: IncomingMessage) => {
  if (!req || !req.headers) {
    return {};
  }
  return cookie.parse(req.headers.cookie || "");
};

MyApp.getInitialProps = async (context: AppContext) => {
  // Extract cookies from AppContext
  return {
    cookies: parseCookies(context?.ctx?.req),
  };
};

// @ts-expect-error Typing does not work correctly here because of getInitialProps
export default appWithTranslation(MyApp);
