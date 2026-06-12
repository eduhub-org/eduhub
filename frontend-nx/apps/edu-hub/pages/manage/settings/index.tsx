import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin } from '../../../hooks/authentication';
import ManageSettingsContent from '../../../components/pages/ManageSettings';

const Settings: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <div>
        <Head>
          <title>EduHub | opencampus.sh</title>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <Page>
          <div className="min-h-[77vh]">{isAdmin && <ManageSettingsContent />}</div>
        </Page>
      </div>
    </>
  );
};

export default Settings;
