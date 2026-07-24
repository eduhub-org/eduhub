import { useMemo } from 'react';

import { useIsAdmin } from './authentication';
import { useUserId } from './user';
import { Course_bool_exp, Program_bool_exp } from '../__generated__/globalTypes';

// Where-fragments that scope the organization-management screens to the data an org admin is allowed
// to manage. Super-admins get an empty filter (no scoping — they see everything). Org admins are
// restricted to programs/courses of organizations they administer, and only for program types where
// their OrganizationAdmin grant includes the matching capability (canManageEvents / canManageCourses
// / canManageDegrees) — the same rules as Hasura org_admin_access write permissions.
//
// This is the read-side counterpart to those write permissions: org_admin select is unioned with
// public (anonymous) read, so without these filters management lists would show other organizations'
// published content and program types the admin cannot manage.

// A filter that matches no rows. Used as a safe default for non-admins while their user id is still
// resolving, so a management list never momentarily renders unscoped (the org_admin select is
// unioned with public read). `id` is a non-null primary key, so `_is_null: true` matches nothing.
const MATCH_NONE = { id: { _is_null: true } } as const;

/** Program types an org admin may manage when the matching OrganizationAdmin flag is set. */
const orgAdminProgramCapabilityOr = (userId: string): Program_bool_exp['_or'] => [
  {
    _and: [
      { type: { _eq: 'EVENTS' } },
      {
        Organization: {
          OrganizationAdmins: {
            _and: [{ userId: { _eq: userId } }, { canManageEvents: { _eq: true } }],
          },
        },
      },
    ],
  },
  {
    _and: [
      { type: { _eq: 'COURSES' } },
      {
        Organization: {
          OrganizationAdmins: {
            _and: [{ userId: { _eq: userId } }, { canManageCourses: { _eq: true } }],
          },
        },
      },
    ],
  },
  {
    _and: [
      { type: { _eq: 'DEGREES' } },
      {
        Organization: {
          OrganizationAdmins: {
            _and: [{ userId: { _eq: userId } }, { canManageDegrees: { _eq: true } }],
          },
        },
      },
    ],
  },
  // A settings admin manages every program type for their organization, so this branch has no
  // `type` constraint — it matches any program whose org has the user's grant with canManageSettings.
  // Mirrors the type-agnostic canManageSettings branch in the Hasura org_admin_access write rules.
  {
    Organization: {
      OrganizationAdmins: {
        _and: [{ userId: { _eq: userId } }, { canManageSettings: { _eq: true } }],
      },
    },
  },
];

// Program_bool_exp scoping for the program management list.
export const useManageProgramWhere = (): Program_bool_exp => {
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  return useMemo(() => {
    if (isAdmin) {
      return {};
    }
    if (!userId) {
      return MATCH_NONE;
    }
    return { _or: orgAdminProgramCapabilityOr(userId) };
  }, [isAdmin, userId]);
};

// Course_bool_exp scoping for the course management list.
export const useManageCourseWhere = (): Course_bool_exp => {
  const isAdmin = useIsAdmin();
  const userId = useUserId();

  return useMemo(() => {
    if (isAdmin) {
      return {};
    }
    if (!userId) {
      return MATCH_NONE;
    }
    return {
      _or: orgAdminProgramCapabilityOr(userId)!.map((branch) => ({
        Program: branch,
      })),
    };
  }, [isAdmin, userId]);
};
