import { useSession } from 'next-auth/react';
import { useRoleQuery } from './authedQuery';
import { useIsAdmin } from './authentication';
import { MY_MANAGEABLE_ORGANIZATION_ADMINS } from '../queries/organizationAdmin';

export const useManageableOrganizationIds = (): number[] => {
  const isAdmin = useIsAdmin();
  const { data: sessionData, status } = useSession();
  const userId = sessionData?.profile?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] as string | undefined;

  const { data } = useRoleQuery(MY_MANAGEABLE_ORGANIZATION_ADMINS, {
    variables: { userId },
    skip: isAdmin || status !== 'authenticated' || !userId,
  });

  if (isAdmin) {
    return [];
  }

  return (
    data?.OrganizationAdmin?.map((admin) => admin.organizationId).filter((id): id is number => id != null) ?? []
  );
};

export const useCanManageOrganizationAdmins = (): boolean => {
  const isAdmin = useIsAdmin();
  const manageableOrganizationIds = useManageableOrganizationIds();

  return isAdmin || manageableOrganizationIds.length > 0;
};
