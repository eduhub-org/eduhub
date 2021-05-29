import { ApolloProvider } from "@apollo/client";
import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { FC } from "react";

import { client } from "../config/apollo";

import "../styles/globals.css";

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <ApolloProvider client={client}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
};

export default appWithTranslation(MyApp);
