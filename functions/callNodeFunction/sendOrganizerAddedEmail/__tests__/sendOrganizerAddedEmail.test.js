import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('sendOrganizerAddedEmail', () => {
  let sendOrganizerAddedEmail;
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

    const module = await import('../index.js');
    sendOrganizerAddedEmail = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
  });

  it('should be a function', () => {
    expect(typeof sendOrganizerAddedEmail).toBe('function');
  });

  it('should return NO_ACTION_NEEDED for non-INSERT operations', async () => {
    const req = {
      body: {
        event: { op: 'UPDATE', data: { new: { id: 1, courseId: 101, userId: 'user-123' } } },
      },
    };

    const result = await sendOrganizerAddedEmail(req, mockLogger);

    expect(result.success).toBe(true);
    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(graphqlRequestMock).not.toHaveBeenCalled();
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('should return COURSE_INSTRUCTOR_NOT_FOUND when GraphQL returns null', async () => {
    graphqlRequestMock.mockResolvedValue({ CourseInstructor_by_pk: null });

    const req = {
      body: {
        event: {
          op: 'INSERT',
          data: { new: { id: 1, courseId: 101, userId: 'user-123' } },
        },
      },
    };

    const result = await sendOrganizerAddedEmail(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('COURSE_INSTRUCTOR_NOT_FOUND');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('should return ORGANIZER_NO_EMAIL when user has no email', async () => {
    graphqlRequestMock.mockResolvedValue({
      CourseInstructor_by_pk: {
        id: 1,
        courseId: 101,
        userId: 'user-123',
        User: { id: 'user-123', firstName: 'John', lastName: 'Doe', email: null },
        Course: { id: 101, title: 'Test Course', Program: { title: 'Program', shortTitle: 'PG', type: 'DEGREE' } },
      },
    });

    const req = {
      body: {
        event: {
          op: 'INSERT',
          data: { new: { id: 1, courseId: 101, userId: 'user-123' } },
        },
      },
    };

    const result = await sendOrganizerAddedEmail(req, mockLogger);

    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('ORGANIZER_NO_EMAIL');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('should queue email successfully and use management URL for courseLink', async () => {
    const mockUser = { id: 'user-123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const mockCourse = { id: 101, title: 'Test Course', Program: { title: 'Program', shortTitle: 'PG', type: 'DEGREE' } };

    graphqlRequestMock.mockResolvedValue({
      CourseInstructor_by_pk: {
        id: 1,
        courseId: 101,
        userId: 'user-123',
        User: mockUser,
        Course: mockCourse,
      },
    });

    queueEmailMock.mockResolvedValue({ success: true, mailId: 'mail-456' });

    const req = {
      body: {
        event: {
          op: 'INSERT',
          data: { new: { id: 1, courseId: 101, userId: 'user-123' } },
        },
      },
    };

    const result = await sendOrganizerAddedEmail(req, mockLogger);

    expect(result.success).toBe(true);
    expect(result.messageKey).toBe('EMAIL_QUEUED_SUCCESS');
    expect(result.mailId).toBe('mail-456');

    expect(queueEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateType: 'ORGANIZER_ADDED',
        recipientEmail: 'john@example.com',
        courseId: 101,
        metadata: { type: 'ORGANIZER_ADDED', courseInstructorId: 1 },
      })
    );

    const variableReplacer = queueEmailMock.mock.calls[0][0].variableReplacer;
    const replaced = variableReplacer('Link: [Enrollment:CourseLink]');
    expect(replaced).toBe('Link: https://edu.opencampus.sh/manage/course/101');
  });

  it('should log user id instead of email (no PII)', async () => {
    const mockUser = { id: 'user-123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const mockCourse = { id: 101, title: 'Test Course', Program: { title: 'Program', shortTitle: 'PG', type: 'DEGREE' } };

    graphqlRequestMock.mockResolvedValue({
      CourseInstructor_by_pk: {
        id: 1,
        courseId: 101,
        userId: 'user-123',
        User: mockUser,
        Course: mockCourse,
      },
    });

    queueEmailMock.mockResolvedValue({ success: true, mailId: 'mail-456' });

    const req = {
      body: {
        event: {
          op: 'INSERT',
          data: { new: { id: 1, courseId: 101, userId: 'user-123' } },
        },
      },
    };

    await sendOrganizerAddedEmail(req, mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'sendOrganizerAddedEmail completed',
      expect.objectContaining({
        courseId: 101,
        mailId: 'mail-456',
        duration: expect.any(Number),
      })
    );
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      expect.stringContaining('john@example.com'),
      expect.anything()
    );
  });

  it('should replace template variables correctly', async () => {
    const mockUser = { id: 'user-123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
    const mockCourse = { id: 101, title: 'Introduction to Programming', Program: { title: 'Program', shortTitle: 'PG', type: 'DEGREE' } };

    graphqlRequestMock.mockResolvedValue({
      CourseInstructor_by_pk: {
        id: 1,
        courseId: 101,
        userId: 'user-123',
        User: mockUser,
        Course: mockCourse,
      },
    });

    queueEmailMock.mockResolvedValue({ success: true, mailId: 'mail-456' });

    const req = {
      body: {
        event: {
          op: 'INSERT',
          data: { new: { id: 1, courseId: 101, userId: 'user-123' } },
        },
      },
    };

    await sendOrganizerAddedEmail(req, mockLogger);

    const variableReplacer = queueEmailMock.mock.calls[0][0].variableReplacer;
    const subject = 'Hello [User:FirstName] [User:LastName], course [Enrollment:CourseId--Course:Name]';
    const body = variableReplacer(subject);
    expect(body).toBe('Hello John Doe, course Introduction to Programming');
  });

  describe('retries', () => {
    const insertRequest = {
      body: { event: { op: 'INSERT', data: { new: { id: 1, courseId: 101, userId: 'user-123' } } } },
    };
    const details = {
      CourseInstructor_by_pk: {
        id: 1,
        courseId: 101,
        userId: 'user-123',
        User: { id: 'user-123', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        Course: { id: 101, title: 'Test Course', Program: { title: 'Program', shortTitle: 'PG', type: 'DEGREE' } },
      },
    };

    it('marks a failure to queue as retryable', async () => {
      graphqlRequestMock.mockResolvedValue(details);
      queueEmailMock.mockResolvedValue({ success: false, error: 'connection reset', messageKey: 'EMAIL_QUEUE_FAILED' });

      const result = await sendOrganizerAddedEmail(insertRequest, mockLogger);

      expect(result).toEqual(expect.objectContaining({ success: false, retryable: true }));
    });

    it('marks unexpected errors as retryable', async () => {
      graphqlRequestMock.mockRejectedValue(new Error('Hasura unavailable'));

      const result = await sendOrganizerAddedEmail(insertRequest, mockLogger);

      expect(result).toEqual(expect.objectContaining({ success: false, retryable: true }));
    });

    it('treats a mail already queued by an earlier delivery as done', async () => {
      graphqlRequestMock.mockResolvedValue(details);
      queueEmailMock.mockResolvedValue({
        success: false,
        error: 'Uniqueness violation. duplicate key value violates unique constraint "MailLog_organizer_added_mail_unique"',
      });

      const result = await sendOrganizerAddedEmail(insertRequest, mockLogger);

      expect(result).toEqual(expect.objectContaining({ success: true, messageKey: 'NO_ACTION_NEEDED' }));
    });

    it('does not retry permanent failures', async () => {
      graphqlRequestMock.mockResolvedValue({ CourseInstructor_by_pk: null });

      const result = await sendOrganizerAddedEmail(insertRequest, mockLogger);

      expect(result.success).toBe(false);
      expect(result.retryable).toBeUndefined();
    });
  });
});
