import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../components/layout/Page';
import { useIsLoggedIn } from '../../hooks/authentication';
import CertificatesContent from '../../components/pages/CertificatesContent';

const MyCertificates: FC = () => {
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <Head>
          <title>My Certificates | EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">{isLoggedIn && <CertificatesContent />}</div>
        </Page>
      </div>
    </>
  );
};

export default MyCertificates;

