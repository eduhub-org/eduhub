import { User_bool_exp } from '../../../__generated__/globalTypes';

/** Everything the access table can be filtered on: the Keycloak role plus the grant capabilities. */
export type AdminPrivilege = 'superAdmin' | 'events' | 'courses' | 'degrees' | 'jobs' | 'settings';

/** Order the filter offers them in: the platform-wide role first, then the per-organization ones. */
export const ADMIN_PRIVILEGES: AdminPrivilege[] = ['superAdmin', 'events', 'courses', 'degrees', 'jobs', 'settings'];

/**
 * A capability privilege matches a user when *some* grant of theirs carries the flag. Super-admin
 * has no flag — it is a Keycloak role, so it is matched by user id in buildPrivilegeCondition.
 */
const CAPABILITY_CONDITION: Record<Exclude<AdminPrivilege, 'superAdmin'>, User_bool_exp> = {
  events: { OrganizationAdmins: { canManageEvents: { _eq: true } } },
  courses: { OrganizationAdmins: { canManageCourses: { _eq: true } } },
  degrees: { OrganizationAdmins: { canManageDegrees: { _eq: true } } },
  jobs: { OrganizationAdmins: { canManageJobs: { _eq: true } } },
  settings: { OrganizationAdmins: { canManageSettings: { _eq: true } } },
};

/** Translation key of a privilege's label, so the filter labels stay in sync with the row details. */
export const privilegeLabelKey = (privilege: AdminPrivilege): string => {
  switch (privilege) {
    case 'superAdmin':
      return 'super_admin_label';
    case 'settings':
      return 'can_manage_users_and_settings';
    case 'events':
      return 'can_manage_events';
    case 'courses':
      return 'can_manage_courses';
    case 'degrees':
      return 'can_manage_degrees';
    case 'jobs':
      return 'can_manage_jobs';
  }
};

/**
 * The User predicate for a privilege selection, or null when nothing is selected. Several selected
 * privileges mean "any of them", the usual reading of a facet filter: picking Events and Jobs lists
 * the admins who can manage either, not only those who can manage both.
 *
 * `superAdminUserIds` are the ids from the getAdminUsers action; an empty list therefore matches
 * nobody, which is correct — without super-admins there is nothing to list under that privilege.
 */
export const buildPrivilegeCondition = (
  selected: AdminPrivilege[],
  superAdminUserIds: string[]
): User_bool_exp | null => {
  const conditions: User_bool_exp[] = selected.map((privilege) =>
    privilege === 'superAdmin' ? { id: { _in: superAdminUserIds } } : CAPABILITY_CONDITION[privilege]
  );

  if (conditions.length === 0) {
    return null;
  }
  return conditions.length === 1 ? conditions[0] : { _or: conditions };
};

/** The capability flags of one grant, as much of OrganizationAdmin as the privilege check needs. */
export type GrantCapabilities = {
  canManageEvents: boolean;
  canManageCourses: boolean;
  canManageDegrees: boolean;
  canManageJobs: boolean;
  canManageSettings: boolean;
};

/**
 * Whether one grant carries the capability a privilege stands for. Used to narrow the *rows* of the
 * access table, where buildPrivilegeCondition narrows the people the database returns: filtering by
 * "can manage events" should list the event grants, not every organization of an event admin.
 *
 * Never true for super-admin, which is a property of the person rather than of a grant, and never
 * true without a grant (the row of a super-admin who administers no organization).
 */
export const grantHasPrivilege = (grant: GrantCapabilities | null, privilege: AdminPrivilege): boolean => {
  if (!grant) {
    return false;
  }
  switch (privilege) {
    case 'superAdmin':
      return false;
    case 'events':
      return grant.canManageEvents;
    case 'courses':
      return grant.canManageCourses;
    case 'degrees':
      return grant.canManageDegrees;
    case 'jobs':
      return grant.canManageJobs;
    case 'settings':
      return grant.canManageSettings;
  }
};
