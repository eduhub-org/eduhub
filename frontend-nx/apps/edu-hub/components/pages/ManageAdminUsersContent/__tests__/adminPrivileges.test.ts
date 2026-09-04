import de from '../../../../locales/de.json';
import en from '../../../../locales/en.json';
import {
  ADMIN_PRIVILEGES,
  buildPrivilegeCondition,
  privilegeLabelKey,
  removeAdminQuestionKey,
} from '../adminPrivileges';

describe('buildPrivilegeCondition', () => {
  it('does not constrain the list when no privilege is selected', () => {
    expect(buildPrivilegeCondition([], ['user-1'])).toBeNull();
  });

  it('matches users with a grant carrying the capability', () => {
    expect(buildPrivilegeCondition(['jobs'], [])).toEqual({
      OrganizationAdmins: { canManageJobs: { _eq: true } },
    });
  });

  it('matches super admins by id, because the role lives in Keycloak', () => {
    expect(buildPrivilegeCondition(['superAdmin'], ['user-1', 'user-2'])).toEqual({
      id: { _in: ['user-1', 'user-2'] },
    });
  });

  it('matches nobody under super admin when there are no super admins', () => {
    expect(buildPrivilegeCondition(['superAdmin'], [])).toEqual({ id: { _in: [] } });
  });

  it('reads several privileges as "any of them" rather than "all of them"', () => {
    expect(buildPrivilegeCondition(['events', 'jobs'], [])).toEqual({
      _or: [
        { OrganizationAdmins: { canManageEvents: { _eq: true } } },
        { OrganizationAdmins: { canManageJobs: { _eq: true } } },
      ],
    });
  });

  it('mixes the Keycloak role with capabilities in one alternative', () => {
    expect(buildPrivilegeCondition(['superAdmin', 'settings'], ['user-1'])).toEqual({
      _or: [{ id: { _in: ['user-1'] } }, { OrganizationAdmins: { canManageSettings: { _eq: true } } }],
    });
  });

  it('builds a condition for every offered privilege', () => {
    ADMIN_PRIVILEGES.forEach((privilege) => {
      expect(buildPrivilegeCondition([privilege], ['user-1'])).not.toBeNull();
    });
  });
});

describe('privilegeLabelKey', () => {
  it('labels every offered privilege', () => {
    const keys = ADMIN_PRIVILEGES.map(privilegeLabelKey);

    expect(keys).toEqual([
      'super_admin_label',
      'can_manage_events',
      'can_manage_courses',
      'can_manage_degrees',
      'can_manage_jobs',
      'can_manage_users_and_settings',
    ]);
  });
});

describe('removeAdminQuestionKey', () => {
  it('names both when the person holds the star and organization roles', () => {
    expect(removeAdminQuestionKey(true, 2)).toBe('remove_admin_confirmation_question_both');
  });

  it('names only the super admin rights of a super admin without any grant', () => {
    expect(removeAdminQuestionKey(true, 0)).toBe('remove_admin_confirmation_question_super_admin');
  });

  it('names only the organization roles of an admin without the star', () => {
    expect(removeAdminQuestionKey(false, 1)).toBe('remove_admin_confirmation_question_organizations');
  });

  it('is translated in every locale, for every case', () => {
    const keys = [
      removeAdminQuestionKey(true, 2),
      removeAdminQuestionKey(true, 0),
      removeAdminQuestionKey(false, 1),
      // Cannot occur (a listed user holds at least one of the two), but must not read as a key.
      removeAdminQuestionKey(false, 0),
    ];

    keys.forEach((key) => {
      expect(en.manageAdminUsers).toHaveProperty(key);
      expect(de.manageAdminUsers).toHaveProperty(key);
    });
  });
});
