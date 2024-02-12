// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn } from '../../../hooks/authentication';

import ManageUsersContent from '../../../components/pages/ManageUsersContent';

const ManageUsers: FC = () => {
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
          <div className="min-h-[77vh]">{isLoggedIn && isAdmin && <ManageUsersContent />}</div>
        </Page>
      </div>
    </>
  );
};

export default ManageUsers;
