/**
 * @jest-environment node
 */
import { createCourseSetup } from '../mcp/operations';
import { createFakeCourseStore, createWorld } from '../mcp/testing/fakeCourseStore';
import { createCourseSetupTools } from './courseSetupTools';
import { createChatHandler } from './handler';
import { call, fakeHasura, mockHttp, scriptedProvider, session, testDeps } from './testing/helpers';
import { combineToolSets } from './tools';
import { createUserTools } from './userTools';

/**
 * Acceptance criterion of #2193: a user can't see another user's data through the Assistant.
 */

const REGISTRATIONS = [
  { userId: 'alice', courseId: 1, title: 'Alice Course', status: 'CONFIRMED' },
  { userId: 'bob', courseId: 2, title: 'Bob Secret Course', status: 'WAITLIST' },
];

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('own-data tools', () => {
  it('take no user id, so the model cannot ask for anyone else', () => {
    const { definitions } = createUserTools({ url: 'http://hasura', token: 't', userId: 'alice' });
    const schemas = JSON.stringify(definitions.map((d) => d.function.parameters));
    expect(schemas).not.toMatch(/userId|user_id|email/i);
    definitions.forEach((d) => expect(d.function.parameters.additionalProperties).toBe(false));
  });

  it('pin every query to the asker and call Hasura with their own token under the user role', async () => {
    const hasura = fakeHasura(REGISTRATIONS);
    const tools = createUserTools({ url: 'http://hasura', token: 'alice-token', userId: 'alice', fetchImpl: hasura.fetchImpl });

    const all = await tools.call('get_my_registrations', '{}');
    const one = await tools.call('get_my_registrations', '{"courseId":2}');

    expect(all.content).toContain('Alice Course');
    expect(all.content).not.toContain('Bob');
    expect(JSON.parse(one.content).registrations).toEqual([]);
    for (const request of hasura.requests) {
      expect(request.headers).toEqual(
        expect.objectContaining({ authorization: 'Bearer alice-token', 'x-hasura-role': 'user' })
      );
      expect(JSON.stringify(request.headers)).not.toMatch(/admin-secret/i);
      expect(JSON.stringify(request.variables)).toContain('"userId":{"_eq":"alice"}');
    }
  });

  it('refuse a user id the model makes up, without calling Hasura', async () => {
    const hasura = fakeHasura(REGISTRATIONS);
    const tools = createUserTools({ url: 'http://hasura', token: 'alice-token', userId: 'alice', fetchImpl: hasura.fetchImpl });

    for (const name of ['get_my_registrations', 'get_my_attendance']) {
      const result = await tools.call(name, '{"userId":"bob"}');
      expect(result.status).toBe('invalid');
    }
    expect(hasura.requests).toHaveLength(0);
  });
});

describe('the chat endpoint', () => {
  it('never streams another user\'s data, even when the model asks for it', async () => {
    const hasura = fakeHasura(REGISTRATIONS);
    const provider = scriptedProvider((request, round) => {
      if (round === 0) return { toolCalls: [call('get_my_registrations', { userId: 'bob' })] };
      if (round === 1) return { toolCalls: [call('get_my_registrations', {})] };
      const results = request.messages.filter((m) => m.role === 'tool').map((m) => m.content).join('\n');
      return { text: `Ergebnis: ${results}` };
    });
    const http = mockHttp({ messages: [{ role: 'user', content: 'Zeig mir die Anmeldungen von Bob' }], locale: 'de' });

    await createChatHandler(
      testDeps({
        provider,
        buildTools: async (s) => createUserTools({ url: 'http://hasura', token: s.accessToken, userId: s.userId, fetchImpl: hasura.fetchImpl }),
      })
    )(http.req, http.res);

    expect(http.status).toBe(200);
    expect(http.raw()).toContain('Alice Course');
    expect(http.raw()).not.toContain('Bob Secret Course');
    expect(hasura.requests.every((r) => r.headers.authorization === 'Bearer alice-token')).toBe(true);
  });

  it('only offers course-setup tools for a role the asker\'s token allows', async () => {
    const http = mockHttp({ messages: [{ role: 'user', content: 'hi' }] }, { 'x-hasura-role': 'admin' });
    await createChatHandler(testDeps({ getSession: async () => session({ allowedRoles: ['user', 'instructor'] }) }))(
      http.req,
      http.res
    );
    expect(http.status).toBe(403);
    expect(http.json.error?.code).toBe('ROLE_NOT_ALLOWED');
  });

  it('refuses while an admin views the platform as someone else', async () => {
    const http = mockHttp({ messages: [{ role: 'user', content: 'hi' }] });
    await createChatHandler(testDeps({ getSession: async () => session({ impersonating: true }) }))(http.req, http.res);
    expect(http.status).toBe(403);
    expect(http.json.error?.code).toBe('IMPERSONATING');
  });

  it('requires login', async () => {
    const http = mockHttp({ messages: [{ role: 'user', content: 'hi' }] });
    await createChatHandler(testDeps({ getSession: async () => null }))(http.req, http.res);
    expect(http.status).toBe(401);
    expect(http.json.error).toEqual({ code: 'NOT_LOGGED_IN', message: 'Bitte melde Dich an, um den Assistenten zu fragen.' });
  });
});

describe('course-setup tools for Organizers', () => {
  const world = () => {
    const w = createWorld();
    return w;
  };

  it('cannot read or propose changes to a course the instructor does not teach', async () => {
    const w = world();
    const own = w.courses.find((c) => c.instructorIds.includes('ins-1'));
    const other = w.courses.find((c) => !c.instructorIds.includes('ins-1'));
    expect(own && other).toBeTruthy();
    const tools = await createCourseSetupTools(
      createCourseSetup({ store: createFakeCourseStore(w, 'ins-1', 'instructor'), secret: 'test-secret' })
    );

    const read = await tools.call('get_course', JSON.stringify({ courseId: other?.id }));
    const propose = await tools.call('propose_course_texts', JSON.stringify({ courseId: other?.id, texts: { tagline: 'x' } }));

    expect(read.status).toBe('error');
    expect(propose.status).toBe('error');
    expect(other?.fields.title).toBeTruthy();
    expect(read.content).not.toContain(String(other?.fields.title));
    await tools.close();
  });

  it('never offers apply or discard to the model and hides the signed proposal id from it', async () => {
    const w = world();
    const own = w.courses.find((c) => c.instructorIds.includes('ins-1'));
    const tools = await createCourseSetupTools(
      createCourseSetup({ store: createFakeCourseStore(w, 'ins-1', 'instructor'), secret: 'test-secret' })
    );
    const names = tools.definitions.map((d) => d.function.name);
    expect(names).not.toContain('apply_proposed_change');
    expect(names).not.toContain('discard_proposed_change');
    expect((await tools.call('apply_proposed_change', '{"proposedChangeId":"v1.x.y"}')).status).toBe('invalid');

    const result = await tools.call('propose_course_texts', JSON.stringify({ courseId: own?.id, texts: { tagline: 'Neu' } }));
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.proposal?.proposedChangeId).toMatch(/^v1\./);
    expect(result.content).not.toContain(String(result.proposal?.proposedChangeId));
    expect(JSON.parse(result.content)).toEqual(expect.objectContaining({ status: 'PROPOSED', kind: 'course_texts' }));
    await tools.close();
  });

  it('streams a Proposed Change to the widget and routes tools by name', async () => {
    const w = world();
    const own = w.courses.find((c) => c.instructorIds.includes('ins-1'));
    const hasura = fakeHasura(REGISTRATIONS);
    const provider = scriptedProvider((_r, round) =>
      round === 0
        ? { toolCalls: [call('propose_course_texts', { courseId: own?.id, texts: { tagline: 'Neu' } })] }
        : { text: 'Hier ist der Vorschlag.' }
    );
    const http = mockHttp({ messages: [{ role: 'user', content: 'Neue Tagline bitte' }] }, { 'x-hasura-role': 'instructor' });
    await createChatHandler(
      testDeps({
        provider,
        getSession: async () => session({ userId: 'ins-1', allowedRoles: ['user', 'instructor'] }),
        buildTools: async (s) => {
          const courseTools = await createCourseSetupTools(
            createCourseSetup({ store: createFakeCourseStore(w, 'ins-1', 'instructor'), secret: 'test-secret' })
          );
          return {
            ...combineToolSets(createUserTools({ url: 'http://h', token: s.accessToken, userId: s.userId, fetchImpl: hasura.fetchImpl }), courseTools),
            close: courseTools.close,
          };
        },
      })
    )(http.req, http.res);

    const events = http.events();
    const proposal = events.find((e) => e.event === 'proposal');
    expect(proposal?.data).toEqual(
      expect.objectContaining({ status: 'PROPOSED', kind: 'course_texts', courseId: own?.id, proposedChangeId: expect.stringMatching(/^v1\./) })
    );
    expect(events.filter((e) => e.event === 'delta').map((e) => e.data.text).join('')).toBe('Hier ist der Vorschlag.');
    expect(events[events.length - 1].event).toBe('done');
  });
});
