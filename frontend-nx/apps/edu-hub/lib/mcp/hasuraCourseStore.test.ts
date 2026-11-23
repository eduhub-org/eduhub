/**
 * @jest-environment node
 */
import { buildSessionMutation, createHasuraCourseStore, managedCourseWhere, pickRole } from './hasuraCourseStore';

const tokenWith = (claims: Record<string, unknown>) =>
  `x.${Buffer.from(JSON.stringify({ 'https://hasura.io/jwt/claims': claims })).toString('base64url')}.sig`;

const TOKEN = tokenWith({ 'x-hasura-user-id': 'user-1', 'x-hasura-allowed-roles': ['org_admin', 'instructor', 'user'] });

const fakeFetch = (responses: unknown[]) => {
  const calls: { headers: Record<string, string>; body: { query: string; variables: Record<string, unknown> } }[] = [];
  const fetchImpl = jest.fn(async (_url: string, init: { headers: Record<string, string>; body: string }) => {
    calls.push({ headers: init.headers, body: JSON.parse(init.body) });
    const next = responses.shift();
    return { ok: true, status: 200, json: async () => next } as Response;
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
};

describe('createHasuraCourseStore', () => {
  it("calls Hasura with the caller's token and role and never the admin secret", async () => {
    const { fetchImpl, calls } = fakeFetch([{ data: { __typename: 'query_root' } }, { data: { Course: [] } }]);
    const store = createHasuraCourseStore({ url: 'http://hasura/v1/graphql', token: TOKEN, role: 'instructor', fetchImpl });
    const caller = await store.verifyCaller();
    expect(caller).toEqual({ userId: 'user-1', role: 'instructor' });
    await store.getManagedCourse(caller, 7);

    for (const { headers } of calls) {
      expect(headers).toEqual({
        'content-type': 'application/json',
        authorization: `Bearer ${TOKEN}`,
        'x-hasura-role': 'instructor',
      });
      expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain('x-hasura-admin-secret');
    }
    expect(calls[1].body.variables.where).toEqual({
      _and: [{ id: { _eq: 7 } }, { CourseInstructors: { User: { id: { _eq: 'user-1' } } } }],
    });
  });

  it('does not trust the token before Hasura has accepted it', async () => {
    const { fetchImpl } = fakeFetch([{ errors: [{ message: 'Could not verify JWT', extensions: { code: 'invalid-jwt' } }] }]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'instructor', fetchImpl });
    await expect(store.verifyCaller()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('reports a write as not saved when the course changed (updated_at no longer matches)', async () => {
    const { fetchImpl, calls } = fakeFetch([{ data: { update_Course: { affected_rows: 0 } } }]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'instructor', fetchImpl });
    await expect(store.updateCourse(7, '2026-11-01T09:00:00+00:00', { tagline: 'x' })).resolves.toBe(false);
    expect(calls[0].body.variables).toEqual({ id: 7, updatedAt: '2026-11-01T09:00:00+00:00', set: { tagline: 'x' } });
  });
});

describe('pickRole', () => {
  it('uses the requested role, else the most capable managing role in the token', () => {
    expect(pickRole(TOKEN, 'instructor')).toBe('instructor');
    expect(pickRole(TOKEN)).toBe('org_admin');
    expect(pickRole(tokenWith({ 'x-hasura-allowed-roles': ['user'] }))).toBe('user');
    expect(pickRole('not-a-jwt')).toBe('user');
    expect(pickRole(tokenWith({ 'x-hasura-allowed-roles': 'admin' }))).toBe('user');
  });
});

describe('managedCourseWhere', () => {
  it('mirrors the Hasura update filters per role', () => {
    expect(managedCourseWhere('admin', 'u')).toEqual({});
    expect(managedCourseWhere('instructor', 'u')).toEqual({ CourseInstructors: { User: { id: { _eq: 'u' } } } });
    const orgAdmin = managedCourseWhere('org_admin', 'u') as { Program: { _or: unknown[] } };
    expect(orgAdmin.Program._or).toContainEqual({
      type: { _eq: 'COURSES' },
      Organization: { OrganizationAdmins: { userId: { _eq: 'u' }, canManageCourses: { _eq: true } } },
    });
    expect(managedCourseWhere('user', 'u')).toEqual({ id: { _is_null: true } });
  });
});

describe('buildSessionMutation', () => {
  it('puts all Session changes in one mutation', () => {
    const { document, variables } = buildSessionMutation(7, {
      delete: [3],
      update: [{ sessionId: 4, set: { title: 'Neu' }, locations: [{ courseLocationId: 70, address: 'Kiel', locationAddressId: 1 }] }],
      create: [
        {
          title: 'Termin',
          description: '',
          startDateTime: '2027-01-12T18:00:00+01:00',
          endDateTime: '2027-01-12T19:30:00+01:00',
          locations: [{ courseLocationId: 70, address: 'Kiel', locationAddressId: 1 }],
        },
      ],
    });
    expect(document.match(/^mutation /gm)).toHaveLength(1);
    expect(document).toContain('d0: delete_Session_by_pk(id: $d0)');
    expect(document).toContain('u0: update_Session_by_pk');
    expect(document).toContain('u0clear: delete_SessionAddress');
    expect(document).toContain('c0: insert_Session_one');
    expect(variables.c0).toMatchObject({
      courseId: 7,
      SessionAddresses: { data: [{ courseLocationId: 70, address: 'Kiel', locationAddressId: 1 }] },
    });
    expect(variables.u0loc).toEqual([{ courseLocationId: 70, address: 'Kiel', locationAddressId: 1, sessionId: 4 }]);
  });
});
