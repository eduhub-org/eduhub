// do not remove this: https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from "next/head";
import Link from "next/link";
import { FC } from "react";
import { ClientOnly } from "../components/common/ClientOnly";
import { OnlyLoggedIn } from "../components/common/OnlyLoggedIn";
import { OffersSearch } from "../components/OffersSearch";

import { Page } from "../components/Page";

const Home: FC = () => {
  return (
    <>
      <Head>
        <title>Rent-A-Scientist</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Page>
        <div>
          <h1 className="text-3xl font-bold mt-4">
            Willkommen zur Anmeldung zu Rent-a-Scientist
          </h1>
          Die Anmeldung läuft ab wie folgt: <br />
          <div>
            1. Schritt: Wählen Sie Ihre Schule und Klassenstufe aus <br />
            2. Schritt: Wählen Sie bis zu fünf Angebote von
            Wissenschaftler*innen aus <br />
            3. Schritt: Erstellen Sie sich ein Nutzerkonto und verifizieren Sie
            Ihre E-Mail-Adresse <br />
            4. Schritt: Ergänzen Sie extra Informationen wie die Anzahl der
            Schüler*innen, den Klassenbezeichner (a, b, c) und eine
            Telefonnummer <br />
            5. Schritt: Wiederholen Sie die Vorgänge 1, 2 und 4, wenn Sie sich
            noch mit anderen Klassen bewerben möchten <br />
          </div>
        </div>

        <ClientOnly>
          <OnlyLoggedIn>
            <>
              <h1 className="text-xl font-bold mt-4">
                Bereits getätigte Anmeldungen
              </h1>
              <div className="mt-2 mb-2">
                <Link href="/myrequests">
                  <a className="underline">Hier</a>
                </Link>{" "}
                können Sie ihre bereits getätigten Anmeldungen sehen.
              </div>
            </>
          </OnlyLoggedIn>
        </ClientOnly>

        <OffersSearch />
      </Page>
    </>
  );
};

export default Home;
