import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";

import { Page } from "../components/Page";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Home: FC = () => {
  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>Content here!</Page>
    </>
  );
};

export default Home;
