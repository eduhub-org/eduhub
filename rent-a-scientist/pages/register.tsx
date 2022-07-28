import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC } from "react";
import { RegisterButton } from "../components/LoginButton";

import { Page } from "../components/Page";
import { useKeycloakUserProfile, useUserId } from "../hooks/user";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const RegisterPage: FC = () => {

  const userId = useUserId();
  const keyCloakProfile = useKeycloakUserProfile();

  console.log("keycloak profile is", keyCloakProfile);

  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        
          <RegisterButton />

          {userId}



      </Page>
    </>
  );
};

export default RegisterPage;
