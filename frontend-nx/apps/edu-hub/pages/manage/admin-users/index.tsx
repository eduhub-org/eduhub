// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn, useIsOrgAdmin } from '../../../hooks/authentication';
import { ManagementRoleProvider } from '../../../hooks/managementRole';

import ManageAdminUsersContent from '../../../components/pages/ManageAdminUsersContent';

const ManageAdminUsers: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const isLoggedIn = useIsLoggedIn();

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="max-w-screen-xl mx-auto">
        <Page>
          <div className="min-h-[77vh]">
            {isLoggedIn && (isAdmin || isOrgAdmin) && (
              <ManagementRoleProvider>
                <ManageAdminUsersContent />
              </ManagementRoleProvider>
            )}
          </div>
        </Page>
      </div>
    </>
  );
};

export default ManageAdminUsers;
