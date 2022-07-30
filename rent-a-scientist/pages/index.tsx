import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Link from "next/link";
import { FC } from "react";
import { ClientOnly } from "../components/common/ClientOnly";
import { OnlyLoggedIn } from "../components/common/OnlyLoggedIn";
import { OffersSearch } from "../components/OffersSearch";

import { Page } from "../components/Page";
import { useRasConfig } from "../hooks/ras";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Home: FC = () => {
  const rsaConfig = useRasConfig();

  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <ClientOnly>
          <OnlyLoggedIn>
            <div className="mt-2 mb-2">
              <Link href="/myrequests">
                <a className="underline">Hier</a>
              </Link>{" "}
              können Sie ihre bereits getätigten Anmeldungen sehen.
            </div>
          </OnlyLoggedIn>
        </ClientOnly>

        <OffersSearch />
      </Page>
    </>
  );
};

export default Home;
