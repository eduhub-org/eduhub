import Head from 'next/head';
import { FC } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { Page } from '../../components/layout/Page';
import { useIsLoggedIn } from '../../hooks/authentication';
import CertificatesContent from '../../components/pages/CertificatesContent';

const MyCertificates: FC = () => {
  const { t } = useTranslation('certificates');
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <div className="max-w-screen-xl mx-auto">
        <Head>
          <title>My Certificates | EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">
            {isLoggedIn ? (
              <CertificatesContent />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg">{t('not_authenticated')}</p>
              </div>
            )}
          </div>
        </Page>
      </div>
    </>
  );
};

export default MyCertificates;

