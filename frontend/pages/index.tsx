import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../components/Page";
import { Button } from "../components/common/Button";
import { TileSlider } from "../components/course/TileSlider";

export const getStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common", "start-page"])),
  },
});

const Home: FC = () => {
  const { t } = useTranslation("start-page");

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div className="h-96 bg-[#F2991D]" />
        <h2 className="text-3xl font-semibold text-center mt-20">
          {t("findCourses")}
        </h2>
        <div className="mt-11">
          <TileSlider />
        </div>
        <div className="w-full flex justify-center mt-16 mb-24">
          <Button>{t("browse")}</Button>
        </div>
        <div className="mx-6 mt-6 mb-24">
          <h2 className="text-3xl font-semibold text-center">
            {t("continueLearning")}
          </h2>
        </div>
      </Page>
    </>
  );
};

export default Home;
