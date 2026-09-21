import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();
const mockQueueEmail = jest.fn();

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.unstable_mockModule('../queueEmail.js', () => ({ queueEmail: mockQueueEmail }));

const { sendSessionRescheduledEmails } = await import('../sessionRescheduledEmail.js');

const SESSION = {
  id: 7,
  title: 'Kickoff',
  courseId: 3,
  startDateTime: '2026-10-01T10:00:00+00:00',
  endDateTime: '2026-10-01T12:00:00+00:00',
};

const client = { request: mockGraphqlRequest };

const enrollees = (users) => ({
  Course_by_pk: {
    id: 3,
    title: 'Web Development',
    CourseEnrollments: users.map((User) => ({ User })),
  },
});

const user = (n, overrides = {}) => ({
  id: `user-${n}`,
  email: `user${n}@example.com`,
  firstName: `User${n}`,
  lastName: 'Test',
  status: 'ACTIVE',
  ...overrides,
});

const run = () => sendSessionRescheduledEmails({ session: SESSION, client, logger: mockLogger });

describe('sendSessionRescheduledEmails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://edu.example.test';
  });

  it('reports success when every recipient was queued', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(enrollees([user(1), user(2)]));
    mockQueueEmail.mockResolvedValue({ success: true });

    const result = await run();

    expect(result).toMatchObject({
      success: true,
      messageKey: 'SESSION_RESCHEDULED_QUEUED',
      queued: 2,
      total: 2,
    });
    expect(mockQueueEmail).toHaveBeenCalledTimes(2);
  });

  it('reports a partial batch as a failure', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(enrollees([user(1), user(2), user(3)]));
    mockQueueEmail
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'no template' })
      .mockResolvedValueOnce({ success: true });

    const result = await run();

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('SESSION_RESCHEDULED_QUEUE_FAILED');
    expect(result.queued).toBe(2);
    expect(result.total).toBe(3);
    expect(result.error).toContain('2 of 3');
  });

  it('reports a wholly failed batch as a failure', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(enrollees([user(1)]));
    mockQueueEmail.mockResolvedValue({ success: false, error: 'insert failed' });

    const result = await run();

    expect(result.success).toBe(false);
    expect(result.queued).toBe(0);
    expect(result.total).toBe(1);
  });

  it('skips anonymized and address-less enrollees', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(
      enrollees([user(1), user(2, { status: 'DELETED' }), user(3, { email: null })])
    );
    mockQueueEmail.mockResolvedValue({ success: true });

    const result = await run();

    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
    expect(mockQueueEmail).toHaveBeenCalledTimes(1);
  });

  it('mails a duplicated address only once', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(
      enrollees([user(1), { ...user(9), email: 'user1@example.com' }])
    );
    mockQueueEmail.mockResolvedValue({ success: true });

    const result = await run();

    expect(result.total).toBe(1);
    expect(mockQueueEmail).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the course has no active enrollees', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(enrollees([]));

    const result = await run();

    expect(result).toMatchObject({ success: true, messageKey: 'NO_RECIPIENTS', queued: 0, total: 0 });
    expect(mockQueueEmail).not.toHaveBeenCalled();
  });

  it('reports a missing course', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ Course_by_pk: null });

    const result = await run();

    expect(result).toMatchObject({ success: false, messageKey: 'COURSE_NOT_FOUND' });
  });
});
