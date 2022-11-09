import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { Page } from "../../components/Page";
import { useIsLoggedIn } from "../../hooks/authentication";
import ProfileOverview from "../../components/profile/ProfileOverview";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common", "users"])),
  },
});

const Profile: FC = () => {
  const { t } = useTranslation("users");
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <Head>
        <title>{t("title")}</title>
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && <ProfileOverview />}</div>
      </Page>
    </>
  );
};

export default Profile;
