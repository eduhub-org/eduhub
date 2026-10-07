import Head from 'next/head';
import { FC } from 'react';
import { useIsAdmin, useIsOrgAdmin } from '../../hooks/authentication';
import { ManagementRoleProvider } from '../../hooks/managementRole';
import { useOrgAdminCapabilities } from '../../hooks/orgAdminCapabilities';
import StatisticsContent from '../../components/pages/StatisticsContent/index';

const Statistics: FC = () => {
  const isAdmin = useIsAdmin();
  const isOrgAdmin = useIsOrgAdmin();
  const { canViewStatistics } = useOrgAdminCapabilities();
  // Org admins with canViewStatistics query under the org_admin role, scoped to their organizations
  // (see useStatisticsProgramWhere); super-admins keep the unscoped admin role.
  const hasAccess = isAdmin || (isOrgAdmin && canViewStatistics);

  return (
    <>
      <Head>
        <title>EduHub | Enrollment Statistics</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      {hasAccess ? (
        <ManagementRoleProvider>
          <StatisticsContent />
        </ManagementRoleProvider>
      ) : (
        <div>Access denied</div>
      )}
    </>
  );
};

export default Statistics;
