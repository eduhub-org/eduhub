import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { LoginButton } from "../components/LoginButton";
import { Page } from "../components/Page";
import { RegisterButton } from "../components/RegisterButton";
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
        <div className="flex flex-col bg-[#F2991D] px-3">
          <span className="flex text-6xl sm:text-9xl mt-16 sm:mt-28">
            {t("headline")}
          </span>
          <div className="flex justify-center mt-4 mb-6 sm:mb-20">
            <span className="text-xl sm:text-5xl text-center">
              {t("subheadline")}
            </span>
          </div>
          <div className="flex justify-center mb-12">
            <Button filled>{t("registerNow")}</Button>
          </div>
        </div>
        <h2 className="text-3xl font-semibold text-center mt-20">
          {t("findCourses")}
        </h2>
        <div className="mt-11">
          <TileSlider />
        </div>
        <div className="w-full flex justify-center mt-16 mb-24">
          <Button>{t("browse")}</Button>
        </div>
        <div className="flex flex-col sm:flex-row mx-6 mt-6 mb-24 sm:mt-48">
          <div className="flex flex-1 flex-col sm:items-center">
            <div>
              <h2 className="text-3xl font-semibold">
                {t("continueLearning")}
              </h2>
              <h3 className="text-lg">{t("learnSubheadline")}</h3>
            </div>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="flex justify-center items-center space-x-3">
              <LoginButton />
              <RegisterButton />
            </div>
          </div>
        </div>
      </Page>
    </>
  );
};

export default Home;
