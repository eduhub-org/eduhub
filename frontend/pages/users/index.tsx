import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { Page } from "../../components/Page";
import UserDashboard from "../../components/users/UserDashboard";
import { useIsAdmin, useIsLoggedIn } from "../../hooks/authentication";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common", "users"])),
  },
});

const Users: FC = () => {
  const { t } = useTranslation("users");
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      <Page>{isLoggedIn && isAdmin && <UserDashboard t={t} />}</Page>
    </>
  );
};

export default Users;
