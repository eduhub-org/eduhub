'use client';

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../../components/layout/Page';
import ManageOrganizationsContent from '../../../../components/pages/ManageOrganizationsContent';

const Organizations: FC = () => {
  return (
    <>
      <Head>
        <title>Manage Organizations</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <ManageOrganizationsContent />
      </Page>
    </>
  );
};

export default Organizations;
