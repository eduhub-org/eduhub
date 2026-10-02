import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

const PARTICIPANT = { id: 'p-1', firstName: 'Alex', lastName: 'Beispiel', email: 'alex@example.com', status: 'ACTIVE' };
const INSTRUCTOR = { id: 'i-1', firstName: 'Ina', lastName: 'Struktor', email: 'ina@example.com' };
const EVENT_ADMIN = { id: 'a-1', firstName: 'Eve', lastName: 'Admin', email: 'eve@example.com' };
const COURSE_ADMIN = { id: 'a-2', firstName: 'Carl', lastName: 'Admin', email: 'carl@example.com' };
const SETTINGS_ADMIN = { id: 'a-3', firstName: 'Sam', lastName: 'Admin', email: 'sam@example.com' };

const REQUESTED_AT = '2026-09-29T10:00:00+00:00';

const grant = (user, caps = {}) => ({
  canManageCourses: false,
  canManageEvents: false,
  canManageDegrees: false,
  canManageSettings: false,
  ...caps,
  User: user,
});

const enrollmentDetails = (overrides = {}) => ({
  CourseEnrollment_by_pk: {
    id: 42,
    isTest: false,
    cancellationRequestedAt: REQUESTED_AT,
    cancellationRequestReason: 'Ich bin krank',
    User: PARTICIPANT,
    Course: {
      id: 7,
      title: 'Paid Event',
      CourseInstructors: [{ User: INSTRUCTOR }],
      Program: {
        type: 'EVENTS',
        Organization: {
          OrganizationAdmins: [
            grant(EVENT_ADMIN, { canManageEvents: true }),
            grant(COURSE_ADMIN, { canManageCourses: true }),
            grant(SETTINGS_ADMIN, { canManageSettings: true }),
            // The instructor is also an admin: one mail, not two.
            grant(INSTRUCTOR, { canManageEvents: true }),
          ],
        },
      },
    },
    ...overrides,
  },
});

const requestEvent = (oldValue = null, newValue = REQUESTED_AT) => ({
  body: {
    event: {
      op: 'UPDATE',
      data: {
        old: { id: 42, cancellationRequestedAt: oldValue },
        new: { id: 42, isTest: false, cancellationRequestedAt: newValue },
      },
    },
  },
});

describe('sendCancellationRequestEmail', () => {
  let sendCancellationRequestEmail;
  let collectOrganizerRecipients;
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
    sendCancellationRequestEmail = module.default;
    collectOrganizerRecipients = module.collectOrganizerRecipients;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HASURA_ENDPOINT = 'https://test.hasura.app/v1/graphql';
    process.env.HASURA_ADMIN_SECRET = 'test-secret';
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
    queueEmailMock.mockResolvedValue({ success: true, mailId: 1 });
  });

  const mockDetailsAndLog = (details = enrollmentDetails(), mailLog = []) => {
    graphqlRequestMock.mockResolvedValueOnce(details).mockResolvedValueOnce({ MailLog: mailLog });
  };

  it('ignores updates that are not a new request', async () => {
    const cleared = await sendCancellationRequestEmail(requestEvent(REQUESTED_AT, null), mockLogger);
    const unchanged = await sendCancellationRequestEmail(requestEvent(REQUESTED_AT, REQUESTED_AT), mockLogger);

    expect(cleared.messageKey).toBe('NO_ACTION_NEEDED');
    expect(unchanged.messageKey).toBe('NO_ACTION_NEEDED');
    expect(graphqlRequestMock).not.toHaveBeenCalled();
  });

  it('mails organizers, matching org admins and the participant once each', async () => {
    mockDetailsAndLog();

    const result = await sendCancellationRequestEmail(requestEvent(), mockLogger);

    expect(result).toMatchObject({ success: true, organizerCount: 3 });
    const sent = queueEmailMock.mock.calls.map(([args]) => [args.templateType, args.recipientEmail]);
    expect(sent).toEqual([
      ['CANCELLATION_REQUEST_ORGANIZER', 'ina@example.com'],
      ['CANCELLATION_REQUEST_ORGANIZER', 'eve@example.com'],
      ['CANCELLATION_REQUEST_ORGANIZER', 'sam@example.com'],
      ['CANCELLATION_REQUEST_CONFIRMATION', 'alex@example.com'],
    ]);
    expect(queueEmailMock.mock.calls[0][0].metadata).toEqual({
      type: 'CANCELLATION_REQUEST',
      enrollmentId: 42,
      requestedAt: REQUESTED_AT,
      recipientUserId: 'i-1',
    });
  });

  it('fills the cancellation placeholders, reason included', async () => {
    mockDetailsAndLog();

    await sendCancellationRequestEmail(requestEvent(), mockLogger);

    const replace = queueEmailMock.mock.calls[0][0].variableReplacer;
    const text = replace(
      '[User:FirstName]|[Cancellation:ParticipantName]|[Cancellation:ParticipantEmail]|[Cancellation:RequestedAt]|[Cancellation:ManageLink]|[Cancellation:Reason]'
    );
    expect(text).toBe(
      'Ina|Alex Beispiel|alex@example.com|29.09.2026|https://edu.opencampus.sh/manage/course/7|<p><strong>Begründung / Reason:</strong><br>Ich bin krank</p>'
    );
  });

  it('skips recipients that already have their mail for this request', async () => {
    mockDetailsAndLog(enrollmentDetails(), [
      { metadata: { recipientUserId: 'i-1' } },
      { metadata: { recipientUserId: 'p-1' } },
    ]);

    await sendCancellationRequestEmail(requestEvent(), mockLogger);

    expect(queueEmailMock.mock.calls.map(([args]) => args.recipientEmail)).toEqual([
      'eve@example.com',
      'sam@example.com',
    ]);
  });

  it('does nothing when the request was withdrawn in the meantime', async () => {
    graphqlRequestMock.mockResolvedValueOnce(enrollmentDetails({ cancellationRequestedAt: null }));

    const result = await sendCancellationRequestEmail(requestEvent(), mockLogger);

    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(queueEmailMock).not.toHaveBeenCalled();
  });

  it('still confirms to the participant and logs an error when nobody can decide', async () => {
    const details = enrollmentDetails();
    details.CourseEnrollment_by_pk.Course.CourseInstructors = [];
    details.CourseEnrollment_by_pk.Course.Program.Organization.OrganizationAdmins = [];
    mockDetailsAndLog(details);

    const result = await sendCancellationRequestEmail(requestEvent(), mockLogger);

    expect(result).toMatchObject({ success: true, organizerCount: 0 });
    expect(queueEmailMock).toHaveBeenCalledTimes(1);
    expect(queueEmailMock.mock.calls[0][0].templateType).toBe('CANCELLATION_REQUEST_CONFIRMATION');
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('reports a partial failure after trying every recipient', async () => {
    mockDetailsAndLog();
    queueEmailMock.mockResolvedValueOnce({ success: false, error: 'boom' });

    const result = await sendCancellationRequestEmail(requestEvent(), mockLogger);

    expect(result).toMatchObject({ success: false, messageKey: 'EMAIL_QUEUE_FAILED' });
    expect(queueEmailMock).toHaveBeenCalledTimes(4);
  });

  it('does not count the participant as their own organizer', () => {
    const course = { CourseInstructors: [{ User: PARTICIPANT }], Program: { type: 'COURSES' } };
    expect(collectOrganizerRecipients(course, PARTICIPANT.id)).toEqual([]);
  });
});
