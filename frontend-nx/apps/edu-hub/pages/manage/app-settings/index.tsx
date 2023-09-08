import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/Page';
import { useIsAdmin } from '../../../hooks/authentication';
import AppSettingsOverview from '../../../components/ManageAppSettingsContent/ManageAppSettingsOverview';

const AppSettings: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <div className="max-w-screen-xl mx-auto mt-14">
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">
            {isAdmin && <AppSettingsOverview />}
          </div>
        </Page>
      </div>
    </>
  );
};

export default AppSettings;
