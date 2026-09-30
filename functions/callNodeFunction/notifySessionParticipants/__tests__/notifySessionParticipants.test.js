import { jest } from '@jest/globals';

const mockGraphqlRequest = jest.fn();
const mockSendSessionRescheduledEmails = jest.fn();

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

jest.unstable_mockModule('../../lib/sessionRescheduledEmail.js', () => ({
  sendSessionRescheduledEmails: mockSendSessionRescheduledEmails,
}));

const { default: notifySessionParticipants } = await import('../index.js');

const INSTRUCTOR_ID = '11111111-1111-1111-1111-111111111111';
const STRANGER_ID = '22222222-2222-2222-2222-222222222222';

const buildRequest = ({ role, userId, sessionId = 7 } = {}) => ({
  body: {
    session_variables: {
      ...(role ? { 'x-hasura-role': role } : {}),
      ...(userId ? { 'x-hasura-user-id': userId } : {}),
    },
    input: { sessionId },
  },
});

const session = (instructorRows) => ({
  Session_by_pk: {
    id: 7,
    title: 'Kickoff',
    courseId: 3,
    startDateTime: '2026-10-01T10:00:00+00:00',
    endDateTime: '2026-10-01T12:00:00+00:00',
    Course: { id: 3, CourseInstructors: instructorRows },
  },
});

describe('notifySessionParticipants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'http://localhost:8080/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-admin-secret';
    mockSendSessionRescheduledEmails.mockResolvedValue({
      success: true,
      messageKey: 'SESSION_RESCHEDULED_QUEUED',
      queued: 2,
      total: 2,
    });
  });

  it('mails participants for an instructor of the course', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(session([{ courseId: 3 }]));

    const result = await notifySessionParticipants(
      buildRequest({ role: 'instructor', userId: INSTRUCTOR_ID }),
      mockLogger
    );

    expect(result).toEqual({
      success: true,
      messageKey: 'SESSION_RESCHEDULED_QUEUED',
      queued: 2,
      total: 2,
    });
    expect(mockSendSessionRescheduledEmails).toHaveBeenCalledTimes(1);
    expect(mockSendSessionRescheduledEmails.mock.calls[0][0].session.id).toBe(7);
  });

  it('mails participants for an admin who instructs nothing', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(session([]));

    const result = await notifySessionParticipants(
      buildRequest({ role: 'admin', userId: STRANGER_ID }),
      mockLogger
    );

    expect(result.success).toBe(true);
    expect(mockSendSessionRescheduledEmails).toHaveBeenCalledTimes(1);
  });

  it('refuses an instructor of a different course', async () => {
    mockGraphqlRequest.mockResolvedValueOnce(session([]));

    const result = await notifySessionParticipants(
      buildRequest({ role: 'instructor', userId: STRANGER_ID }),
      mockLogger
    );

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('NOTIFY_SESSION_UNAUTHORIZED');
    expect(mockSendSessionRescheduledEmails).not.toHaveBeenCalled();
  });

  it('refuses a plain user role', async () => {
    const result = await notifySessionParticipants(
      buildRequest({ role: 'user', userId: INSTRUCTOR_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe('NOTIFY_SESSION_UNAUTHORIZED');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('refuses a request without a user id', async () => {
    const result = await notifySessionParticipants(buildRequest({ role: 'instructor' }), mockLogger);

    expect(result.messageKey).toBe('NOTIFY_SESSION_UNAUTHORIZED');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric sessionId', async () => {
    const result = await notifySessionParticipants(
      buildRequest({ role: 'admin', userId: INSTRUCTOR_ID, sessionId: 'abc' }),
      mockLogger
    );

    expect(result.messageKey).toBe('NOTIFY_SESSION_INVALID_INPUT');
    expect(mockGraphqlRequest).not.toHaveBeenCalled();
  });

  it('reports a missing session', async () => {
    mockGraphqlRequest.mockResolvedValueOnce({ Session_by_pk: null });

    const result = await notifySessionParticipants(
      buildRequest({ role: 'admin', userId: INSTRUCTOR_ID }),
      mockLogger
    );

    expect(result.messageKey).toBe('SESSION_NOT_FOUND');
    expect(mockSendSessionRescheduledEmails).not.toHaveBeenCalled();
  });

  it('surfaces a lookup failure without throwing', async () => {
    mockGraphqlRequest.mockRejectedValueOnce(new Error('boom'));

    const result = await notifySessionParticipants(
      buildRequest({ role: 'admin', userId: INSTRUCTOR_ID }),
      mockLogger
    );

    expect(result).toEqual({ success: false, error: 'boom', messageKey: 'NOTIFY_SESSION_FAILED' });
  });
});
