/**
 * @jest-environment node
 */
import { createCourseSetup } from '../mcp/operations';
import { createFakeCourseStore, createWorld } from '../mcp/testing/fakeCourseStore';
import { createCourseSetupTools } from './courseSetupTools';
import { createChatHandler } from './handler';
import { createFeedbackHandler } from './feedback';
import { onAssistantMetric, AssistantMetric } from './metrics';
import { ProviderError } from './provider';
import { call, fakeConfig, fakeHasura, mockHttp, scriptedProvider, session, testDeps } from './testing/helpers';
import { combineToolSets } from './tools';
import { createUserTools } from './userTools';
import { createRateLimiter } from './limits';

/**
 * Acceptance criterion of #2193: prompts and tool calls are never logged with their content.
 * Every console method and stdout/stderr are captured while a full conversation runs, with
 * recognisable markers in the prompt, the page error, the tool arguments, the tool results and the
 * reply; none of them may show up in the logs.
 */

const MARKERS = {
  prompt: 'PROMPT-MARKER-7f3a',
  pageError: 'PAGE-ERROR-MARKER-91bd',
  registration: 'REGISTRATION-MARKER-c2e8',
  tagline: 'TOOL-ARG-MARKER-55aa',
  reply: 'REPLY-MARKER-0d44',
  feedback: 'FEEDBACK-MARKER-e1f0',
};

let logged: string[];

beforeEach(() => {
  logged = [];
  const capture = (...args: unknown[]) => {
    logged.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a) ?? String(a))).join(' '));
  };
  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((m) => jest.spyOn(console, m).mockImplementation(capture));
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    capture(String(chunk));
    return true;
  });
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
    capture(String(chunk));
    return true;
  });
});
afterEach(() => jest.restoreAllMocks());

const expectNoContentLogged = () => {
  const all = logged.join('\n');
  Object.values(MARKERS).forEach((marker) => expect(all).not.toContain(marker));
};

const organizerDeps = (provider: ReturnType<typeof scriptedProvider>) => {
  const world = createWorld();
  const hasura = fakeHasura([{ userId: 'ins-1', courseId: 1, title: MARKERS.registration, status: 'CONFIRMED' }]);
  return testDeps({
    provider,
    getSession: async () => session({ userId: 'ins-1', allowedRoles: ['user', 'instructor'] }),
    buildTools: async (s) => {
      const courseTools = await createCourseSetupTools(
        createCourseSetup({ store: createFakeCourseStore(world, 'ins-1', 'instructor'), secret: 'test-secret' })
      );
      return {
        ...combineToolSets(createUserTools({ url: 'http://h', token: s.accessToken, userId: s.userId, fetchImpl: hasura.fetchImpl }), courseTools),
        close: courseTools.close,
      };
    },
  });
};

it('logs only anonymous metrics for a conversation with tools and proposals', async () => {
  const metrics: AssistantMetric[] = [];
  const unsubscribe = onAssistantMetric((m) => metrics.push(m));
  const provider = scriptedProvider((_r, round) => {
    if (round === 0) return { toolCalls: [call('get_my_registrations', '{"courseId": "not a number"}')] };
    if (round === 1) return { toolCalls: [call('get_my_registrations', {})] };
    if (round === 2) return { toolCalls: [call('propose_course_texts', { courseId: 1, texts: { tagline: MARKERS.tagline } })] };
    if (round === 3) return { toolCalls: [call('get_course', { courseId: 2 })] };
    return { text: MARKERS.reply };
  });
  const http = mockHttp({
    messages: [{ role: 'user', content: `Frage ${MARKERS.prompt}` }],
    pageContext: { path: '/manage/course/1', route: '/manage/course/[courseId]', courseId: 1, errorMessage: MARKERS.pageError },
  }, { 'x-hasura-role': 'instructor' });

  await createChatHandler(organizerDeps(provider))(http.req, http.res);
  unsubscribe();

  // The conversation did reach the model and the stream...
  expect(JSON.stringify(provider.requests[0].messages)).toContain(MARKERS.pageError);
  expect(http.raw()).toContain(MARKERS.reply);
  expect(http.raw()).toContain(MARKERS.tagline);
  // ...but none of it reached the logs, only the metric line.
  expectNoContentLogged();
  const chat = metrics.find((m) => m.metric === 'assistant_chat');
  expect(chat).toEqual(
    expect.objectContaining({
      outcome: 'ok',
      audience: 'organizer',
      invalidToolCalls: 1,
      toolErrors: 1,
      proposals: 1,
      tools: { get_my_registrations: 2, propose_course_texts: 1, get_course: 1 },
    })
  );
  expect(logged.some((l) => l.includes('"metric":"assistant_chat"'))).toBe(true);
});

it('logs no content when the provider fails', async () => {
  const provider = scriptedProvider(() => {
    throw new ProviderError('PROVIDER_ERROR', 500);
  });
  const http = mockHttp({ messages: [{ role: 'user', content: MARKERS.prompt }] });
  await createChatHandler(testDeps({ provider }))(http.req, http.res);
  expect(http.events().map((e) => e.event)).toEqual(['error', 'done']);
  expectNoContentLogged();
});

it('logs no content when a tool name the model invents is not offered', async () => {
  const provider = scriptedProvider((_r, round) =>
    round < 2 ? { toolCalls: [call(`steal_${MARKERS.prompt}`, { x: MARKERS.tagline })] } : { text: 'ok' }
  );
  const http = mockHttp({ messages: [{ role: 'user', content: 'x' }] });
  await createChatHandler(testDeps({ provider }))(http.req, http.res);
  expectNoContentLogged();
});

it('logs no feedback content', async () => {
  const hasura = fakeHasura([]);
  const http = mockHttp({ rating: 'down', consent: true, messages: [{ role: 'user', content: MARKERS.feedback }], comment: MARKERS.feedback });
  await createFeedbackHandler({
    config: fakeConfig(),
    getSession: async () => session(),
    rateLimiter: createRateLimiter({ rateShortMax: 5, rateShortWindowMs: 60_000, rateDailyMax: 5 }),
    hasuraUrl: 'http://h',
    fetchImpl: hasura.fetchImpl,
  })(http.req, http.res);
  expect(http.status).toBe(204);
  expectNoContentLogged();
});
