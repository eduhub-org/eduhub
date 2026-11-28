// do not remove this https://github.com/nrwl/nx/issues/9017#issuecomment-1140066503
import path from 'path';
path.resolve('./next.config.js');

import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn, useIsOrgAdmin } from '../../../hooks/authentication';
import { useOrgAdminCapabilities } from '../../../hooks/orgAdminCapabilities';

import ManageProjectsOverviewContent from '../../../components/pages/ManageProjectsOverviewContent';

const ManageProjects: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const { canManageCourses, canManageEvents } = useOrgAdminCapabilities();
  const isLoggedIn = useIsLoggedIn();
  // Same audience as the menu entry: Admins, and Org Admins who manage courses or events.
  const canView = isAdmin || (isOrgAdmin && (canManageCourses || canManageEvents));

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="max-w-screen-xl mx-auto">
        <Page>
          <div className="min-h-[77vh]">{isLoggedIn && canView && <ManageProjectsOverviewContent />}</div>
        </Page>
      </div>
    </>
  );
};

export default ManageProjects;
