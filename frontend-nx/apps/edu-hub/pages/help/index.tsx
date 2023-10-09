import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../components/Page';

const help: FC = () => {
  const helpDocUrl = process.env.HELP_DOCS_URL;

  return (
    <div className="max-w-screen-xl mx-auto mt-14">
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page className="text-white">
        <iframe className="responsive-iframe" src={helpDocUrl}></iframe>
      </Page>
    </div>
  );
};

export default help;
