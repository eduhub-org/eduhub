import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';

import ManageEmailTemplatesContent from '../../../components/pages/ManageEmailTemplatesContent';

const EmailTemplates: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <Head>
        <title>EduHub | Email Templates</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <ManageEmailTemplatesContent />}</div>
      </Page>
    </>
  );
};

export default EmailTemplates;
