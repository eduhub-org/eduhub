import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const speaker = { id: 'speaker-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', status: 'ACTIVE' };
const course = { id: 101, title: 'Test Course' };
const program = { id: 7, title: 'Test Program' };

const insertEvent = (sessionVariables = { 'x-hasura-user-id': 'organizer-1' }) => ({
  body: {
    event: {
      op: 'INSERT',
      session_variables: sessionVariables,
      data: { new: { id: 55, sessionId: 9, userId: speaker.id } },
    },
  },
});

const detailsResponse = (session = { Course: course, Program: null }, user = speaker) => ({
  SessionSpeaker_by_pk: { id: 55, userId: user?.id, User: user, Session: session },
});

const priorResponse = ({ speakerRows = 0, instructorRows = 0 } = {}) => ({
  SessionSpeaker_aggregate: { aggregate: { count: speakerRows } },
  CourseInstructor_aggregate: { aggregate: { count: instructorRows } },
});

describe('sendSpeakerAddedEmail', () => {
  let sendSpeakerAddedEmail;
  let queueEmailMock;
  let graphqlRequestMock;

  beforeAll(async () => {
    queueEmailMock = jest.fn();
    graphqlRequestMock = jest.fn();

    jest.unstable_mockModule('../../lib/queueEmail.js', () => ({
      queueEmail: queueEmailMock,
    }));

    jest.unstable_mockModule('graphql-request', () => {
      const actual = jest.requireActual('graphql-request');
      return {
        ...actual,
        GraphQLClient: jest.fn().mockImplementation(() => ({
          request: graphqlRequestMock,
        })),
      };
    });

    sendSpeakerAddedEmail = (await import('../index.js')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
    queueEmailMock.mockResolvedValue({ success: true, mailId: 'mail-1' });
  });

  it('ignores operations other than INSERT', async () => {
    const result = await sendSpeakerAddedEmail({ body: { event: { op: 'DELETE', data: {} } } }, mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(graphqlRequestMock).not.toHaveBeenCalled();
  });

  it('queues the mail for the first session of a course', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse()).mockResolvedValueOnce(priorResponse());

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.messageKey).toBe('EMAIL_QUEUED_SUCCESS');
    expect(graphqlRequestMock.mock.calls[1][0].variables).toEqual(
      expect.objectContaining({
        sessionSpeakerId: 55,
        userId: speaker.id,
        sessionWhere: { courseId: { _eq: 101 } },
      })
    );
    expect(queueEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateType: 'SESSION_SPEAKER_ADDED',
        recipientEmail: speaker.email,
        recipientUser: speaker,
        courseId: 101,
        metadata: { type: 'SESSION_SPEAKER_ADDED', sessionSpeakerId: 55 },
      })
    );

    const replace = queueEmailMock.mock.calls[0][0].variableReplacer;
    expect(replace('[Enrollment:CourseId--Course:Name] [Enrollment:CourseLink] [System:PrivacyPolicyLink]')).toBe(
      'Test Course https://edu.opencampus.sh/course/101 https://edu.opencampus.sh/privacy'
    );
  });

  it('does not mail again for a later session of the same course', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse()).mockResolvedValueOnce(priorResponse({ speakerRows: 1 }));

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('skips organizers of the course', async () => {
    graphqlRequestMock
      .mockResolvedValueOnce(detailsResponse())
      .mockResolvedValueOnce(priorResponse({ instructorRows: 1 }));

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('skips people who added themselves', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse());

    const result = await sendSpeakerAddedEmail(insertEvent({ 'x-hasura-user-id': speaker.id }), mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(graphqlRequestMock).toHaveBeenCalledTimes(1);
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('does nothing when the speaker row was already removed', async () => {
    graphqlRequestMock.mockResolvedValueOnce({ SessionSpeaker_by_pk: null });

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('reports a speaker without email address', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse(undefined, { ...speaker, email: null }));

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('SPEAKER_NO_EMAIL');
  });

  it('marks a failure to queue as retryable', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse()).mockResolvedValueOnce(priorResponse());
    queueEmailMock.mockResolvedValue({ success: false, error: 'connection reset', messageKey: 'EMAIL_QUEUE_FAILED' });

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result).toEqual(expect.objectContaining({ success: false, retryable: true }));
  });

  it('marks unexpected errors as retryable', async () => {
    graphqlRequestMock.mockRejectedValueOnce(new Error('Hasura unavailable'));

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result).toEqual(expect.objectContaining({ success: false, retryable: true }));
  });

  it('treats a mail already queued by an earlier delivery as done', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse()).mockResolvedValueOnce(priorResponse());
    queueEmailMock.mockResolvedValue({
      success: false,
      error: 'Uniqueness violation. duplicate key value violates unique constraint "MailLog_session_speaker_mail_unique"',
    });

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.success).toBe(true);
    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(result.retryable).toBeUndefined();
  });

  it('does not retry a speaker without email address', async () => {
    graphqlRequestMock.mockResolvedValueOnce(detailsResponse(undefined, { ...speaker, email: null }));

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.retryable).toBeUndefined();
  });

  it('scopes a program-wide session to its program and links the portal', async () => {
    graphqlRequestMock
      .mockResolvedValueOnce(detailsResponse({ Course: null, Program: program }))
      .mockResolvedValueOnce(priorResponse());

    const result = await sendSpeakerAddedEmail(insertEvent(), mockLogger);

    expect(result.messageKey).toBe('EMAIL_QUEUED_SUCCESS');
    expect(graphqlRequestMock.mock.calls[1][0].variables).toEqual(
      expect.objectContaining({
        sessionWhere: { programId: { _eq: 7 } },
        instructorWhere: { Course: { programId: { _eq: 7 } } },
      })
    );
    expect(queueEmailMock).toHaveBeenCalledWith(expect.objectContaining({ courseId: null }));

    const replace = queueEmailMock.mock.calls[0][0].variableReplacer;
    expect(replace('[Enrollment:CourseId--Course:Name] [Enrollment:CourseLink]')).toBe(
      'Test Program https://edu.opencampus.sh'
    );
  });
});
