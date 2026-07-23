import { useMemo } from 'react';

import { MY_ORG_ADMIN_CAPABILITIES } from '../queries/organizationAdmin';
import { MyOrgAdminCapabilities } from '../queries/__generated__/MyOrgAdminCapabilities';
import { useIsOrgAdmin } from './authentication';
import { useOrgAdminQuery } from './authedQuery';
import { useUserId } from './user';

export type OrgAdminCapabilities = {
  canManageCourses: boolean;
  canManageEvents: boolean;
  canManageDegrees: boolean;
};

const EMPTY_ORG_ADMIN_CAPABILITIES: OrgAdminCapabilities = {
  canManageCourses: false,
  canManageEvents: false,
  canManageDegrees: false,
};

/**
 * Per-capability flags for the current org admin (true if ANY OrganizationAdmin grant has the flag).
 * Super-admins and non-org-admins get all-false; callers should combine with useIsAdmin() for menu
 * visibility (super-admins always see all three management entries).
 */
export const useOrgAdminCapabilities = (): OrgAdminCapabilities => {
  const isOrgAdmin = useIsOrgAdmin();
  const userId = useUserId();
  const { data } = useOrgAdminQuery<MyOrgAdminCapabilities>(MY_ORG_ADMIN_CAPABILITIES, {
    variables: { userId },
    skip: !isOrgAdmin || !userId,
  });

  return useMemo(() => {
    if (!isOrgAdmin || !data?.OrganizationAdmin?.length) {
      return EMPTY_ORG_ADMIN_CAPABILITIES;
    }
    return {
      canManageCourses: data.OrganizationAdmin.some((grant) => grant.canManageCourses),
      canManageEvents: data.OrganizationAdmin.some((grant) => grant.canManageEvents),
      canManageDegrees: data.OrganizationAdmin.some((grant) => grant.canManageDegrees),
    };
  }, [isOrgAdmin, data]);
};
