import Head from 'next/head';
import { FC } from 'react';
import { Page } from '../../../components/layout/Page';
import { useIsAdmin, useIsLoggedIn, useIsOrgAdmin } from '../../../hooks/authentication';
import { ManagementRoleProvider } from '../../../hooks/managementRole';
import { useOrgAdminCapabilities } from '../../../hooks/orgAdminCapabilities';

import ManageExpertsContent from '../../../components/pages/ManageExpertsContent';

const ManageExperts: FC = () => {
  const isLoggedIn = useIsLoggedIn();
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const caps = useOrgAdminCapabilities();
  // Org admins see the experts of their organization's courses (docs/EXPERT_DIRECTORY.md); job-board
  // only admins have no courses and no directory.
  const canManagePrograms =
    caps.canManageCourses || caps.canManageEvents || caps.canManageDegrees || caps.canManageSettings;

  return (
    <>
      <Head>
        <title>EduHub | opencampus.sh</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="max-w-screen-xl mx-auto">
        <Page>
          <div className="min-h-[77vh]">
            {isLoggedIn && (isAdmin || (isOrgAdmin && canManagePrograms)) && (
              <ManagementRoleProvider>
                <ManageExpertsContent />
              </ManagementRoleProvider>
            )}
          </div>
        </Page>
      </div>
    </>
  );
};

export default ManageExperts;
