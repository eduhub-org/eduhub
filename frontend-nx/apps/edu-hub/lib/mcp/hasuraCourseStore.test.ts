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

  it("saves a course's mail: a new copy keeps the default's sender, an update is guarded by updated_at", async () => {
    const base = { id: 1, type: 'SESSION_REMINDER', subject: 'Alt', content: '<p>Alt</p>', from: 'edu@x', cc: 'cc@x', bcc: null, updatedAt: 't1' };
    const change = { type: 'SESSION_REMINDER', subject: 'Neu', content: '<p>Neu</p>' };
    const { fetchImpl, calls } = fakeFetch([
      { data: { insert_MailTemplate_one: { id: 9 } } },
      { data: { update_MailTemplate: { affected_rows: 0 } } },
    ]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'org_admin', fetchImpl });

    await expect(store.saveCourseMail(7, change, { base })).resolves.toBe(true);
    expect(calls[0].body.variables.object).toEqual({ ...change, courseId: 7, from: 'edu@x', cc: 'cc@x', bcc: null });

    await expect(store.saveCourseMail(7, change, { existing: { ...base, id: 9 } })).resolves.toBe(false);
    expect(calls[1].body.variables).toEqual({ id: 9, updatedAt: 't1', set: { subject: 'Neu', content: '<p>Neu</p>' } });
  });

  it('reports a course mail copy made in the meantime as not saved', async () => {
    const base = { id: 1, type: 'SESSION_REMINDER', subject: 'Alt', content: 'x', from: null, cc: null, bcc: null, updatedAt: 't1' };
    const { fetchImpl } = fakeFetch([
      { errors: [{ message: 'Uniqueness violation. duplicate key value violates unique constraint', extensions: { code: 'constraint-violation' } }] },
      { errors: [{ message: 'something else', extensions: { code: 'unexpected' } }] },
    ]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'org_admin', fetchImpl });
    const change = { type: 'SESSION_REMINDER', subject: 'Neu', content: 'y' };
    await expect(store.saveCourseMail(7, change, { base })).resolves.toBe(false);
    await expect(store.saveCourseMail(7, change, { base })).rejects.toMatchObject({ code: 'HASURA_ERROR' });
  });

  it('reports a write as not saved when the course changed (updated_at no longer matches)', async () => {
    const { fetchImpl, calls } = fakeFetch([{ data: { update_Course: { affected_rows: 0 } } }]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'instructor', fetchImpl });
    await expect(store.updateCourse(7, '2026-11-01T09:00:00+00:00', { tagline: 'x' })).resolves.toBe(false);
    expect(calls[0].body.variables).toEqual({ id: 7, updatedAt: '2026-11-01T09:00:00+00:00', set: { tagline: 'x' } });
  });
  it('reports the online meeting link as the address of the online location', async () => {
    const course = {
      id: 7,
      updated_at: '2026-11-01T09:00:00+00:00',
      programId: 1,
      Program: { type: 'COURSES' },
      CourseEnrollments_aggregate: { aggregate: { count: 0 } },
      CourseLocations: [
        { id: 70, locationOption: 'ONLINE', defaultSessionAddress: null, defaultSessionAddressId: null, OnlineMeetingLink: { url: 'https://zoom.example/j/1' } },
        { id: 71, locationOption: 'KIEL', defaultSessionAddress: 'Wall 47', defaultSessionAddressId: 1, OnlineMeetingLink: null },
      ],
      Sessions: [
        {
          id: 1,
          title: 'Kick-off',
          description: null,
          startDateTime: '2026-11-02T09:00:00+00:00',
          endDateTime: '2026-11-02T10:00:00+00:00',
          updated_at: null,
          SessionAddresses: [
            { courseLocationId: 70, address: '', locationAddressId: null, OnlineMeetingLink: { url: 'https://zoom.example/j/2' } },
            { courseLocationId: 71, address: 'Wall 47', locationAddressId: 1, OnlineMeetingLink: null },
          ],
        },
      ],
    };
    const { fetchImpl } = fakeFetch([{ data: { Course: [course] } }]);
    const store = createHasuraCourseStore({ url: 'http://hasura', token: TOKEN, role: 'instructor', fetchImpl });
    const snapshot = await store.getManagedCourse({ userId: 'user-1', role: 'instructor' }, 7);

    expect(snapshot?.courseLocations).toEqual([
      { id: 70, locationOption: 'ONLINE', defaultSessionAddress: 'https://zoom.example/j/1', defaultSessionAddressId: null },
      { id: 71, locationOption: 'KIEL', defaultSessionAddress: 'Wall 47', defaultSessionAddressId: 1 },
    ]);
    expect(snapshot?.sessions[0].locations).toEqual([
      { courseLocationId: 70, address: 'https://zoom.example/j/2', locationAddressId: null },
      { courseLocationId: 71, address: 'Wall 47', locationAddressId: 1 },
    ]);
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
