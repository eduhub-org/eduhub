import { FC } from 'react';
import { Metadata } from 'next';
import getT from 'next-translate/getT';

import { Page } from '../../../components/layout/Page';

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const t = await getT(params.lang, ['metadata']);

  return {
    title: t('metadata:help.title'),
    description: t('metadata:help.description'),
  };
}

const Help: FC = () => {
  const helpDocUrl = process.env.HELP_DOCS_URL;

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Page className="text-white">
        <iframe className="responsive-iframe" src={helpDocUrl}></iframe>
      </Page>
    </div>
  );
};

export default Help;
