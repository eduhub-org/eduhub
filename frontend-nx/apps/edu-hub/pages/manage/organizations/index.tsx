import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import ManageOrganizationsContent from '../../../components/pages/ManageOrganizationsContent';
import { useIsAdmin } from '../../../hooks/authentication';

const Organizations: FC = () => {
  const isAdmin = useIsAdmin();

  return (
    <>
      <Head>
        <title>Manage Organizations</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        {isAdmin && <ManageOrganizationsContent />}
      </Page>
    </>
  );
};

export default Organizations;