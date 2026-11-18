import { jest } from '@jest/globals';

const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };

const course = (sessionOverrides = {}) => ({
  id: 1,
  title: 'Data Science',
  Sessions: [
    {
      id: 11,
      title: 'Kickoff',
      startDateTime: '2026-01-01T10:00:00Z',
      endDateTime: '2026-01-01T12:00:00Z',
      questionaire_sent: false,
      SessionSpeakers: [],
      ...sessionOverrides,
    },
  ],
  Program: {
    startQuestionnaire: 'https://forms.example/start',
    speakerQuestionnaire: 'https://forms.example/speaker',
    closingQuestionnaire: 'https://forms.example/closing',
    title: 'WiSe 26',
  },
  CourseEnrollments: [{ User: { id: 'u1', email: 'kim@example.org', firstName: 'Kim', lastName: 'Muster' } }],
  CourseInstructors: [{ userId: 'i1' }],
});

describe('sendQuestionaires', () => {
  let sendQuestionaires;
  let callNodeFunction;
  let requestMock;

  const database = (courses) =>
    jest.fn(async (document) => {
      const query = String(document);
      if (query.includes('Course(')) return { Course: courses };
      if (query.includes('insert_MailLog_one')) return { insert_MailLog_one: { id: 1 } };
      if (query.includes('update_Session_by_pk')) return { update_Session_by_pk: { title: 'x' } };
      throw new Error(`Unexpected query: ${query.slice(0, 60)}`);
    });

  const mails = () =>
    requestMock.mock.calls.filter(([document]) => String(document).includes('insert_MailLog_one')).map(([, v]) => v);
  const marked = () =>
    requestMock.mock.calls.filter(([document]) => String(document).includes('update_Session_by_pk')).map(([, v]) => v.id);

  const cronRequest = (headers = {}) => ({ headers, body: { scheduled_time: '2026-11-16T10:00:00Z', payload: {} } });

  beforeAll(async () => {
    jest.unstable_mockModule('graphql-request', () => {
      const actual = jest.requireActual('graphql-request');
      return {
        ...actual,
        GraphQLClient: jest.fn().mockImplementation(() => ({
          request: (...args) => requestMock(...args),
        })),
      };
    });
    ({ default: sendQuestionaires } = await import('../index.js'));
    ({ callNodeFunction } = await import('../../index.js'));
  });

  beforeEach(() => {
    process.env.HASURA_CLOUD_FUNCTION_SECRET = 'test-secret';
  });

  it('queues start and closing questionnaires for an ended session and marks it sent', async () => {
    requestMock = database([course()]);

    const result = await sendQuestionaires(cronRequest(), logger);

    expect(result).toEqual({ result: 'questionaires sent' });
    expect(mails().map((mail) => mail.to)).toEqual(['kim@example.org', 'kim@example.org']);
    expect(mails()[0].content).toContain('https://forms.example/start');
    expect(mails()[1].content).toContain('https://forms.example/closing');
    expect(mails()[0].subject).toBe('Feedback zu Data Science bei opencampus.sh');
    expect(marked()).toEqual([11]);
  });

  it('adds the speaker questionnaire when a speaker is not an instructor', async () => {
    requestMock = database([course({ SessionSpeakers: [{ id: 1, userId: 'guest-speaker' }] })]);

    await sendQuestionaires(cronRequest(), logger);

    expect(mails().some((mail) => mail.content.includes('https://forms.example/speaker'))).toBe(true);
  });

  it.each([
    ['already sent', { questionaire_sent: true }],
    ['not yet over', { endDateTime: '2999-01-01T12:00:00Z' }],
  ])('skips a session that is %s', async (_label, overrides) => {
    requestMock = database([course(overrides)]);

    await sendQuestionaires(cronRequest(), logger);

    expect(mails()).toEqual([]);
    expect(marked()).toEqual([]);
  });

  it('answers 500 when the courses cannot be loaded', async () => {
    requestMock = jest.fn(async () => { throw new Error('down'); });

    const result = await sendQuestionaires(cronRequest(), logger);

    expect(result.httpStatus).toBe(500);
  });

  describe('through callNodeFunction', () => {
    const call = async (headers) => {
      const res = {};
      res.status = jest.fn(() => res);
      res.json = jest.fn(() => res);
      await callNodeFunction(cronRequest(headers), res);
      return res.status.mock.calls[0][0];
    };

    it('runs the cron with the secret', async () => {
      requestMock = database([course()]);

      expect(await call({ 'hasura-secret': 'test-secret', 'function-name': 'sendQuestionaires' })).toBe(200);
      expect(marked()).toEqual([11]);
    });

    it('answers 401 without the secret', async () => {
      requestMock = database([course()]);

      expect(await call({ 'function-name': 'sendQuestionaires' })).toBe(401);
      expect(requestMock).not.toHaveBeenCalled();
    });
  });
});
