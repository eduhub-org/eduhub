/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';

import ManageExpertsContent from '../../../components/pages/ManageExpertsContent';

const ManageExperts: FC = () => {
  const isAdmin = useIsAdmin();
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="max-w-screen-xl mx-auto">
        <Page>
          <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <ManageExpertsContent />}</div>
        </Page>
      </div>
    </>
  );
};

export default ManageExperts;

