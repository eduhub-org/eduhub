import { useMemo } from 'react';

import { useIsAdmin } from './authentication';
import { useUserId } from './user';

// Where-fragments that scope the organization-management screens to the data an org admin is allowed
// to manage. Super-admins get an empty filter (no scoping — they see everything); org admins get a
// filter restricting to organizations they administer, matched via their OrganizationAdmin rows.
//
// This is the read-side counterpart to the Hasura write permissions: writes are already gated
// per-organization/per-capability server-side, but the org_admin select permission is unioned with
// the public (anonymous) read, so without this filter a management list would also show other
// organizations' published programs. Filtering by the OrganizationAdmins relationship keeps the
// lists limited to the admin's own organizations.

// Program_bool_exp scoping for the program management list.
export const useManageProgramWhere = (): Record<string, unknown> => {
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  return useMemo(() => {
    if (isAdmin || !userId) {
      return {};
    }
    return {
      Organization: {
        OrganizationAdmins: {
          userId: { _eq: userId },
        },
      },
    };
  }, [isAdmin, userId]);
};

// Course_bool_exp scoping for the course management list. A course belongs to a program, which
// belongs to an organization; org admins only see courses of programs in organizations they
// administer. Super-admins get an empty filter.
export const useManageCourseWhere = (): Record<string, unknown> => {
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  return useMemo(() => {
    if (isAdmin || !userId) {
      return {};
    }
    return {
      Program: {
        Organization: {
          OrganizationAdmins: {
            userId: { _eq: userId },
          },
        },
      },
    };
  }, [isAdmin, userId]);
};
