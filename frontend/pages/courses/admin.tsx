import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { Page } from "../../components/Page";
import { useIsInstructor, useIsLoggedIn } from "../../hooks/authentication";
import Dashboard from "../../components/courses/admin/Dashboard";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["course-admin-page"])),
  },
});

const Admin: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const isInstructor = useIsInstructor();
  const { t } = useTranslation("course-admin-page");
  return (
    <>
      <Head>{<title>{t("pageTitle")}</title>}</Head>
      <Page>{isLoggedIn && isInstructor && <Dashboard t={t} />}</Page>
    </>
  );
};

export default Admin;
