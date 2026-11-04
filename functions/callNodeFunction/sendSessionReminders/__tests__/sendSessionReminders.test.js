import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();
const mockQueueEmail = jest.fn();

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('graphql-request', () => {
  const actual = jest.requireActual('graphql-request');
  return {
    ...actual,
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: mockGraphqlRequest,
    })),
  };
});

jest.unstable_mockModule('../../lib/queueEmail.js', () => ({
  queueEmail: mockQueueEmail,
}));

const {
  default: sendSessionReminders,
  isReminderDue,
  formatReminderDateTime,
  formatReminderDateTimeRange,
  resolveSessionLocations,
} = await import('../index.js');

const NOW = new Date('2026-10-26T10:00:00Z');
const HOUR = 60 * 60 * 1000;
const at = (hoursFromNow) => new Date(NOW.getTime() + hoursFromNow * HOUR).toISOString();

const USER_A = { id: 'aaaaaaaa-0000-0000-0000-000000000001', firstName: 'Ada', lastName: 'A', email: 'ada@example.com', status: 'ACTIVE' };
const USER_B = { id: 'bbbbbbbb-0000-0000-0000-000000000002', firstName: 'Ben', lastName: 'B', email: 'ben@example.com', status: 'ACTIVE' };

const buildCourse = ({ id = 1, leadHours = 24, firstSessionInHours = 20, enrollees = [USER_A, USER_B] } = {}) => ({
  id,
  title: 'Vom Werkzeug zum Akteur',
  sessionReminderLeadHours: leadHours,
  Sessions: [
    {
      id: id * 100,
      title: 'Auftakt',
      startDateTime: at(firstSessionInHours),
      endDateTime: at(firstSessionInHours + 2),
      SessionAddresses: [],
    },
  ],
  CourseEnrollments: enrollees.map((User, index) => ({ id: index + 1, User })),
});

const respondWith = (courses, sentByCourse = {}) =>
  mockGraphqlRequest.mockImplementation((_query, variables) => {
    if (variables?.metadata) {
      const userIds = sentByCourse[variables.metadata.courseId] ?? [];
      return Promise.resolve({ MailLog: userIds.map((userId) => ({ metadata: { userId } })) });
    }
    return Promise.resolve({ Course: courses });
  });

describe('sendSessionReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(NOW);
    process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
    mockQueueEmail.mockResolvedValue({ success: true, mailId: 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queues one reminder per participant once the lead time is reached', async () => {
    respondWith([buildCourse({ leadHours: 24, firstSessionInHours: 20 })]);

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result.success).toBe(true);
    expect(result.totalEmailsSent).toBe(2);
    expect(mockQueueEmail).toHaveBeenCalledTimes(2);
    expect(mockQueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateType: 'SESSION_REMINDER',
        recipientEmail: 'ada@example.com',
        courseId: 1,
        metadata: { type: 'SESSION_REMINDER', courseId: 1, sessionId: 100, userId: USER_A.id },
      })
    );
  });

  it('waits while the first session is further away than the lead time', async () => {
    respondWith([buildCourse({ leadHours: 24, firstSessionInHours: 30 })]);

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result.totalEmailsSent).toBe(0);
    expect(mockQueueEmail).not.toHaveBeenCalled();
  });

  it('skips course participants who already have the reminder, and reminds late enrollees', async () => {
    respondWith([buildCourse({ leadHours: 48, firstSessionInHours: 3 })], { 1: [USER_A.id] });

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result.totalEmailsSent).toBe(1);
    expect(mockQueueEmail).toHaveBeenCalledTimes(1);
    expect(mockQueueEmail.mock.calls[0][0].recipientEmail).toBe('ben@example.com');
  });

  it('skips anonymized users', async () => {
    respondWith([buildCourse({ enrollees: [{ ...USER_A, status: 'DELETED' }] })]);

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result.totalEmailsSent).toBe(0);
  });

  it('fills the reminder variables in Berlin time', async () => {
    respondWith([buildCourse({ enrollees: [USER_A] })]);

    await sendSessionReminders({ body: {} }, mockLogger);

    const replace = mockQueueEmail.mock.calls[0][0].variableReplacer;
    // 20h after 10:00 UTC is 06:00 UTC next day, 07:00 in Berlin (CET from 25.10.).
    expect(replace('[Session:DateTimeRange]')).toBe('27.10.2026, 07:00–09:00');
    expect(replace('[Session:ReminderText]')).toBe('is starting soon');
  });

  it('reports a failure instead of throwing when Hasura errors', async () => {
    mockGraphqlRequest.mockRejectedValue(new Error('boom'));

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result).toEqual(
      expect.objectContaining({ success: false, retryable: true, messageKey: 'SESSION_REMINDERS_FAILED' })
    );
  });

  it('logs and counts a reminder queueEmail rejects, and keeps going', async () => {
    respondWith([buildCourse()]);
    mockQueueEmail
      .mockResolvedValueOnce({ success: false, messageKey: 'INVALID_EMAIL_FORMAT' })
      .mockResolvedValueOnce({ success: true, mailId: 2 });

    const result = await sendSessionReminders({ body: {} }, mockLogger);

    expect(result).toEqual(expect.objectContaining({ success: true, totalEmailsSent: 1, totalEmailsFailed: 1 }));
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('INVALID_EMAIL_FORMAT'));
  });
});

describe('isReminderDue', () => {
  it('is due inside the lead time and before the start', () => {
    expect(isReminderDue(at(23), 24, NOW)).toBe(true);
    expect(isReminderDue(at(0.1), 24, NOW)).toBe(true);
  });

  it('is not due before the lead time, after the start, or when switched off', () => {
    expect(isReminderDue(at(25), 24, NOW)).toBe(false);
    expect(isReminderDue(at(-1), 24, NOW)).toBe(false);
    expect(isReminderDue(at(1), null, NOW)).toBe(false);
  });
});

describe('date formatting', () => {
  it('formats numerically in Berlin time', () => {
    expect(formatReminderDateTime('2026-10-27T16:00:00Z')).toBe('27.10.2026, 17:00');
  });

  it('shows only the end time for a same-day session', () => {
    expect(formatReminderDateTimeRange('2026-10-27T16:00:00Z', '2026-10-27T18:00:00Z')).toBe('27.10.2026, 17:00–19:00');
  });

  it('shows both timestamps when the session ends on another day', () => {
    expect(formatReminderDateTimeRange('2026-10-27T21:00:00Z', '2026-10-28T11:00:00Z')).toBe(
      '27.10.2026, 22:00 – 28.10.2026, 12:00'
    );
  });
});

describe('resolveSessionLocations', () => {
  it('prefers a linked venue, labelled', () => {
    expect(
      resolveSessionLocations([
        { address: 'old text', LocationAddress: { shortLabel: 'ZBW Kiel', address: 'Düsternbrooker Weg 120' } },
      ])
    ).toEqual(['ZBW Kiel (Düsternbrooker Weg 120)']);
  });

  it('falls back to the free-text address and to "Online" without a link', () => {
    expect(
      resolveSessionLocations([
        { address: 'https://meet.example.com/x', CourseLocation: { locationOption: 'ONLINE' } },
        { address: '', CourseLocation: { locationOption: 'ONLINE' } },
      ])
    ).toEqual(['https://meet.example.com/x', 'Online']);
  });

  it('drops the migration placeholder label', () => {
    expect(
      resolveSessionLocations([{ LocationAddress: { shortLabel: 'generic address', address: 'Wall 1' } }])
    ).toEqual(['Wall 1']);
  });
});
