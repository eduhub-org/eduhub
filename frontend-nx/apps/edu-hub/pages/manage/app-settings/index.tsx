import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin } from '../../../hooks/authentication';
import AppSettingsOverview from '../../../components/pages/ManageAppSettingsContent/ManageAppSettingsOverview';

const AppSettings: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <div>
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">{isAdmin && <AppSettingsOverview />}</div>
        </Page>
      </div>
    </>
  );
};

export default AppSettings;
