import { jest } from '@jest/globals';

process.env.GUEST_TOKEN_SECRET = 'test-guest-token-secret-at-least-32-characters';

const { default: confirmGuestRegistration } = await import('../index.js');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TOKEN_ID = '22222222-2222-4222-8222-222222222222';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const course = {
  id: 42,
  title: 'Guest event',
  published: true,
  guestRegistrationEnabled: true,
  registrationType: 'DIRECT_CONFIRMATION',
  maxParticipants: 20,
  activeParticipantCount: 3,
  Program: {
    published: true,
    type: 'EVENTS',
    organizationId: 7,
  },
};

const token = (overrides = {}) => ({
  id: TOKEN_ID,
  userId: USER_ID,
  courseId: course.id,
  newsletterOptIn: false,
  expiresAt: '2099-01-01T00:00:00.000Z',
  usedAt: null,
  User: {
    id: USER_ID,
    email: 'guest@example.com',
    status: 'GUEST',
  },
  ...overrides,
});

function operationName(document) {
  const source = typeof document === 'string' ? document : document?.loc?.source?.body ?? '';
  return source.match(/\b(?:query|mutation)\s+(\w+)/)?.[1];
}

function createClient({ confirmationToken = token(), enrollments = [] } = {}) {
  const request = jest.fn(async (document) => {
    switch (operationName(document)) {
      case 'FindGuestRegistrationToken':
        return { GuestRegistrationToken: [confirmationToken] };
      case 'GetConfirmCourse':
        return { Course_by_pk: course };
      case 'FindConfirmEnrollment':
        return { CourseEnrollment: enrollments };
      case 'FindGuestUsersByEmail':
        return { User: [confirmationToken.User] };
      case 'InsertGuestEnrollment':
        return { insert_CourseEnrollment_one: { id: 99 } };
      case 'MarkGuestRegistrationTokenUsed':
        return { update_GuestRegistrationToken_by_pk: { id: TOKEN_ID } };
      default:
        throw new Error('Unexpected operation: ' + operationName(document));
    }
  });

  return { request };
}

function requestedOperations(client) {
  return client.request.mock.calls.map(([document]) => operationName(document));
}

describe('confirmGuestRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GUEST_TOKEN_SECRET = 'test-guest-token-secret-at-least-32-characters';
  });

  it('confirms a new enrollment and returns its management token', async () => {
    const client = createClient();

    const result = await confirmGuestRegistration(
      { body: { input: { token: 'raw-confirmation-token' } } },
      logger,
      { client }
    );

    expect(result).toMatchObject({
      success: true,
      courseId: course.id,
      courseTitle: course.title,
      messageKey: 'GUEST_REGISTRATION_CONFIRMED',
    });
    expect(result.manageToken).toContain(USER_ID);
    expect(requestedOperations(client)).toContain('InsertGuestEnrollment');
    expect(requestedOperations(client)).toContain('MarkGuestRegistrationTokenUsed');
  });

  it('keeps a consumed confirmation link single-use', async () => {
    const client = createClient({
      confirmationToken: token({ usedAt: '2026-10-01T12:00:00.000Z' }),
      enrollments: [{ id: 99 }],
    });

    const result = await confirmGuestRegistration(
      { body: { input: { token: 'raw-confirmation-token' } } },
      logger,
      { client }
    );

    expect(result).toEqual({ success: false, messageKey: 'TOKEN_ALREADY_USED' });
    expect(requestedOperations(client)).toEqual(['FindGuestRegistrationToken']);
    expect(requestedOperations(client)).not.toContain('InsertGuestEnrollment');
    expect(requestedOperations(client)).not.toContain('MarkGuestRegistrationTokenUsed');
  });

  it('does not create an enrollment when the management signing key is missing', async () => {
    const client = createClient();
    delete process.env.GUEST_TOKEN_SECRET;

    const result = await confirmGuestRegistration(
      { body: { input: { token: 'raw-confirmation-token' } } },
      logger,
      { client }
    );

    expect(result).toMatchObject({
      success: false,
      messageKey: 'GUEST_CONFIRMATION_FAILED',
    });
    expect(requestedOperations(client)).toEqual(['FindGuestRegistrationToken']);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('GUEST_TOKEN_SECRET is not configured'),
      expect.any(Object)
    );
  });

  it('does not return management access after the confirmation token expires', async () => {
    const client = createClient({
      confirmationToken: token({
        usedAt: '1999-12-31T12:00:00.000Z',
        expiresAt: '2000-01-01T12:00:00.000Z',
      }),
      enrollments: [{ id: 99 }],
    });

    const result = await confirmGuestRegistration(
      { body: { input: { token: 'raw-confirmation-token' } } },
      logger,
      { client }
    );

    expect(result).toEqual({ success: false, messageKey: 'TOKEN_EXPIRED' });
    expect(requestedOperations(client)).toEqual(['FindGuestRegistrationToken']);
  });
});
