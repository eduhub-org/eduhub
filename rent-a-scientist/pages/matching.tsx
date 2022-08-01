import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { FC, useMemo } from "react";
import { CsvDownloadButton } from "../components/matching/CsvDownloadButton";
import { MatchingCreation } from "../components/matching/MatchingCreation";

import { Page } from "../components/Page";
import { useAuthedQuery } from "../hooks/authedQuery";
import { useIsAdmin } from "../hooks/authentication";
import { useRasConfig } from "../hooks/ras";
import { ALL_REQUESTS } from "../queries/ras_matching";
import { AllRequests } from "../queries/__generated__/AllRequests";

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ["common"])),
  },
});

const Matching: FC = () => {
  const isAdmin = useIsAdmin();

  const allRequests = useAuthedQuery<AllRequests>(ALL_REQUESTS);

  const rsaConfig = useRasConfig();

  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        {isAdmin && (
          <div className="m-4">
            <div className="m-4">
              <CsvDownloadButton />
            </div>

            {!rsaConfig.visibility && (
              <div>
                Das Matching steht nun fest, es kann in der CSV Datei eingesehen
                werden. <br />
                E-Mails werden nun automatisch verschickt.
              </div>
            )}

            {rsaConfig.visibility && (
              <div className="m-4">
                <MatchingCreation />
              </div>
            )}
          </div>
        )}

        {!isAdmin && <div>Sie sind kein Admin</div>}
      </Page>
    </>
  );
};

export default Matching;
