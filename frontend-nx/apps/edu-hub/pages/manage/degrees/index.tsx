// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import ProgramManagementDashboard from '../../../components/pages/ManageCoursesContent/ProgramManagementDashboard';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn, useIsOrgAdmin } from '../../../hooks/authentication';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { ProgramType } from '../../../types/enums';

const Index: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const isLoggedIn = useIsLoggedIn();
  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Page>
        <div className="min-h-[77vh]">
          {isLoggedIn && (isAdmin || isOrgAdmin) && (
            <ManagementRoleProvider>
              <ProgramManagementDashboard programType={ProgramType.DEGREES} />
            </ManagementRoleProvider>
          )}
        </div>
      </Page>
    </>
  );
};

export default Index;
