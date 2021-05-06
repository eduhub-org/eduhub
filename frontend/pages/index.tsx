import Head from "next/head";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../components/Page";

const Home: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <h1>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p>{t("header.signin")}</p>
      </Page>
    </>
  );
};

export default Home;
