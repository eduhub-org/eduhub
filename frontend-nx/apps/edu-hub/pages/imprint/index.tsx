import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';

const Imprint: FC = () => {
  const { locale } = useRouter();
  const isEnglish = locale === 'en';

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>{isEnglish ? 'Imprint' : 'Impressum'} | EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <div className="flex flex-row text-white">
          <h1 className="text-4xl font-bold p-24 pl-12 pb-0">{isEnglish ? 'Imprint' : 'Impressum'}</h1>
        </div>

        <div className="flex flex-wrap">
          <div className="ml-12 mr-10 mt-4">
            <h2 className="text-2xl mb-2">{isEnglish ? 'Address' : 'Anschrift'}</h2>
            <dl>
              <dd>Campusbusinessbox e.V.</dd>
              <dd>Wissenschaftszentrum Kiel</dd>
              <dd>Fraunhoferstraße 13</dd>
              <dd>24118 Kiel</dd>
              <dt className="italic mt-2">{isEnglish ? 'Phone' : 'Telefon'}</dt>
              <dd>0431.90894380</dd>
              <dt className="italic mt-2">Email</dt>
              <dd>
                <a href="mailto:edu@opencampus.sh">edu @ opencampus.sh</a>
              </dd>
            </dl>
          </div>
          <div className="ml-12 mr-10 mt-4">
            <h2 className="text-2xl mb-2">{isEnglish ? 'Board' : 'Vorstand'}</h2>
            <dl>
              <dt className="italic mt-2">{isEnglish ? '1st Chairman' : '1. Vorsitzender'}</dt>
              <dd>Harm Brand</dd>
              <dt className="italic mt-2">{isEnglish ? 'Board Member' : 'Beisitzer'}</dt>
              <dd>Alexander Ohrt</dd>
              <dt className="italic mt-2">{isEnglish ? 'Board Member' : 'Beisitzer'}</dt>
              <dd>Frederik Steinbock</dd>
            </dl>
          </div>
          <div className="col-0 col-md-1"></div>
        </div>

        <div className="ml-12 mr-10 mt-8">
          <p>
            {isEnglish
              ? 'Information on the processing of your personal data can be found in our '
              : 'Informationen zur Verarbeitung deiner personenbezogenen Daten findest du in unserer '}
            <a href="/privacy" className="underline hover:text-gray-300">
              {isEnglish ? 'Privacy Policy' : 'Datenschutzerklärung'}
            </a>
            .
          </p>
        </div>
      </Page>
    </div>
  );
};

export default Imprint;
