import { toAccessRows } from '../accessRows';

const organization = (id: number, name: string) => ({ __typename: 'Organization' as const, id, name });

const grant = (id: number, organizationName: string, capabilities: Record<string, boolean> = {}) =>
  ({
    __typename: 'OrganizationAdmin',
    id,
    organizationId: id * 10,
    Organization: organization(id * 10, organizationName),
    canManageEvents: false,
    canManageCourses: false,
    canManageDegrees: false,
    canManageJobs: false,
    canManageSettings: false,
    ...capabilities,
  }) as any;

const user = (id: string, firstName: string, grants: any[]) =>
  ({
    __typename: 'User',
    id,
    firstName,
    lastName: 'Tester',
    email: `${firstName}@example.com`,
    Organization: organization(1, 'Profile org'),
    OrganizationAdmins: grants,
  }) as any;

describe('toAccessRows', () => {
  it('emits one row per administered organization, keeping a person together', () => {
    const rows = toAccessRows(
      [user('u1', 'Ada', [grant(1, 'Uni Kiel'), grant(2, 'opencampus.sh')]), user('u2', 'Grace', [grant(3, 'FH West')])],
      [],
      []
    );

    expect(rows.map((row) => [row.user.firstName, row.grant?.Organization.name])).toEqual([
      ['Ada', 'Uni Kiel'],
      ['Ada', 'opencampus.sh'],
      ['Grace', 'FH West'],
    ]);
  });

  it('keys organization rows by grant id so each row deletes its own grant', () => {
    const rows = toAccessRows([user('u1', 'Ada', [grant(7, 'Uni Kiel')])], [], []);

    expect(rows[0].id).toBe(7);
    expect(rows[0].grant?.id).toBe(7);
  });

  it('gives a super admin without any organization one row keyed by user id', () => {
    const rows = toAccessRows([user('u1', 'Ada', [])], ['u1'], []);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'u1', grant: null, isSuperAdmin: true });
  });

  it('marks every row of a super admin, since the role belongs to the person', () => {
    const rows = toAccessRows([user('u1', 'Ada', [grant(1, 'Uni Kiel'), grant(2, 'opencampus.sh')])], ['u1'], []);

    expect(rows.map((row) => row.isSuperAdmin)).toEqual([true, true]);
  });

  it('keeps only the rows carrying the filtered capability', () => {
    const rows = toAccessRows(
      [user('u1', 'Ada', [grant(1, 'Uni Kiel', { canManageEvents: true }), grant(2, 'opencampus.sh')])],
      [],
      ['events']
    );

    expect(rows.map((row) => row.grant?.Organization.name)).toEqual(['Uni Kiel']);
  });

  it('keeps rows matching any of the filtered capabilities', () => {
    const rows = toAccessRows(
      [
        user('u1', 'Ada', [
          grant(1, 'Uni Kiel', { canManageEvents: true }),
          grant(2, 'opencampus.sh', { canManageJobs: true }),
          grant(3, 'FH West'),
        ]),
      ],
      [],
      ['events', 'jobs']
    );

    expect(rows.map((row) => row.grant?.Organization.name)).toEqual(['Uni Kiel', 'opencampus.sh']);
  });

  it('keeps every organization of a super admin when filtering on the role', () => {
    const rows = toAccessRows(
      [user('u1', 'Ada', [grant(1, 'Uni Kiel'), grant(2, 'opencampus.sh')]), user('u2', 'Grace', [grant(3, 'FH West')])],
      ['u1'],
      ['superAdmin']
    );

    expect(rows.map((row) => row.grant?.Organization.name)).toEqual(['Uni Kiel', 'opencampus.sh']);
  });

  it('drops the grantless row of a super admin when filtering on a capability', () => {
    expect(toAccessRows([user('u1', 'Ada', [])], ['u1'], ['events'])).toEqual([]);
  });

  it('returns nothing for an empty page', () => {
    expect(toAccessRows([], ['u1'], [])).toEqual([]);
  });
});
