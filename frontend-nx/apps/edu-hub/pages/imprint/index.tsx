import Head from 'next/head';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { ImprintContent } from '../../components/legal/ImprintContent';
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
      <Page className="text-label-primary">
        <div className="flex flex-row">
          <h1 className="text-4xl font-bold p-24 pl-12 pb-0">{isEnglish ? 'Imprint' : 'Impressum'}</h1>
        </div>

        <div className="ml-12 mr-10">
          <ImprintContent privacyHref="/privacy" />
        </div>
      </Page>
    </div>
  );
};

export default Imprint;
