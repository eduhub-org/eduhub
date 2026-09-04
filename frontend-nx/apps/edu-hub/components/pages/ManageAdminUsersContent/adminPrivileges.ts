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

/**
 * Translation key of the row-delete confirmation, so the question only claims what the person
 * actually holds: a super-admin without any grant loses no organization role, and an org admin
 * without the star loses no super-admin rights.
 *
 * A listed user always holds at least one of the two (the table lists grant holders and the
 * super-admins from Keycloak), so the final case is the organization-only one.
 */
export const removeAdminQuestionKey = (isSuperAdmin: boolean, organizationCount: number): string => {
  if (isSuperAdmin && organizationCount > 0) {
    return 'remove_admin_confirmation_question_both';
  }
  if (isSuperAdmin) {
    return 'remove_admin_confirmation_question_super_admin';
  }
  return 'remove_admin_confirmation_question_organizations';
};
