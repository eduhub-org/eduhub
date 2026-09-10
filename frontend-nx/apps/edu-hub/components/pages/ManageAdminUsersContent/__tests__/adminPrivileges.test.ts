import de from '../../../../locales/de.json';
import en from '../../../../locales/en.json';
import { ADMIN_PRIVILEGES, buildPrivilegeCondition, grantHasPrivilege, privilegeLabelKey } from '../adminPrivileges';

const grant = (overrides: Partial<Parameters<typeof grantHasPrivilege>[0]> = {}) => ({
  canManageEvents: false,
  canManageCourses: false,
  canManageDegrees: false,
  canManageJobs: false,
  canManageSettings: false,
  ...overrides,
});

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

describe('grantHasPrivilege', () => {
  it('is true when the grant carries the capability', () => {
    expect(grantHasPrivilege(grant({ canManageJobs: true }), 'jobs')).toBe(true);
  });

  it('is false when the grant does not carry it', () => {
    expect(grantHasPrivilege(grant({ canManageJobs: true }), 'events')).toBe(false);
  });

  it('is false for super admin, which belongs to the person rather than to a grant', () => {
    expect(grantHasPrivilege(grant({ canManageSettings: true }), 'superAdmin')).toBe(false);
  });

  it('is false without a grant, for the row of a super admin with no organization', () => {
    ADMIN_PRIVILEGES.forEach((privilege) => {
      expect(grantHasPrivilege(null, privilege)).toBe(false);
    });
  });
});

describe('locale coverage', () => {
  it('translates every privilege label in every locale', () => {
    ADMIN_PRIVILEGES.map(privilegeLabelKey).forEach((key) => {
      expect(en.manageAdminUsers).toHaveProperty(key);
      expect(de.manageAdminUsers).toHaveProperty(key);
    });
  });

  it('translates every row-delete confirmation in every locale', () => {
    [
      'deletion_confirmation_question',
      'deletion_confirmation_question_super_admin',
      'remove_super_admin_confirmation_question',
    ].forEach((key) => {
      expect(en.manageAdminUsers).toHaveProperty(key);
      expect(de.manageAdminUsers).toHaveProperty(key);
    });
  });
});
