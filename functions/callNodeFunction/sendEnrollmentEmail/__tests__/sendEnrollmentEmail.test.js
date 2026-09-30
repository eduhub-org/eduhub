import { jest } from '@jest/globals';
import { GraphQLClient } from 'graphql-request';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('sendEnrollmentEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be a function', async () => {
    const { default: sendEnrollmentEmail } = await import('../index.js');
    expect(typeof sendEnrollmentEmail).toBe('function');
  });

  it('should handle DELETE operations correctly', async () => {
    const { default: sendEnrollmentEmail } = await import('../index.js');
    
    const req = {
      body: {
        event: {
          op: 'DELETE',
          data: {
            new: { id: 1, status: 'APPLIED' },
            old: null
          }
        }
      }
    };

    const result = await sendEnrollmentEmail(req, mockLogger);
    
    expect(result.success).toBe(true);
    expect(result.messageKey).toBe('NO_ACTION_NEEDED');
    expect(result.message).toBe('No action needed for this operation');
  });

  it('should handle UPDATE operations (Hasura filters unchanged values)', async () => {
    const { default: sendEnrollmentEmail } = await import('../index.js');
    
    const req = {
      body: {
        event: {
          op: 'UPDATE',
          data: {
            new: { id: 1, status: 'APPLIED' },
            old: { id: 1, status: 'APPLIED' }
          }
        }
      }
    };

    // Note: In practice, Hasura event triggers only fire when values actually change
    // This test scenario shouldn't occur in real usage, but we test the function behavior
    const result = await sendEnrollmentEmail(req, mockLogger);
    
    // Function will attempt to process but fail due to missing GraphQL setup in test
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('EMAIL_PROCESSING_FAILED');
  });

  it('should attempt to process valid enrollment status changes', async () => {
    const { default: sendEnrollmentEmail } = await import('../index.js');
    
    const req = {
      body: {
        event: {
          op: 'UPDATE',
          data: {
            new: { 
              id: 1, 
              status: 'INVITED',
              userId: 'user-123',
              courseId: 101,
              created_at: '2024-01-15T10:00:00Z'
            },
            old: { 
              id: 1, 
              status: 'APPLIED',
              userId: 'user-123',
              courseId: 101
            }
          }
        }
      }
    };

    try {
      await sendEnrollmentEmail(req, mockLogger);
      // The function will likely fail due to GraphQL connection, but that's expected in this test environment
    } catch (error) {
      // This is expected since we don't have a real GraphQL endpoint
      expect(error).toBeDefined();
    }
    
    // At minimum, it should have logged the start message
    expect(mockLogger.info).toHaveBeenCalledWith('########## Send Enrollment Email ##########');
  });
});

describe('registration confirmation templates', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['CONFIRMED', 'ACTIVE', 'DIRECT_CONFIRMATION', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'ACTIVE', 'DIRECT_WITH_INPUT', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'ACTIVE', 'DIRECT_CONFIRMATION_AND_PAYMENT', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'ACTIVE', 'DIRECT_WITH_INPUT_AND_PAYMENT', 'REGISTRATION_CONFIRMED'],
    ['REGISTERED', 'GUEST', 'DIRECT_CONFIRMATION', 'REGISTRATION_CONFIRMED'],
    ['REGISTERED', 'GUEST', 'DIRECT_WITH_INPUT', 'REGISTRATION_CONFIRMED'],
    ['CONFIRMED', 'ACTIVE', 'APPROVAL_WITH_INPUT', 'APPLICATION_CONFIRMED'],
  ])('%s / %s / %s queues %s', async (status, userStatus, registrationType, templateType) => {
    await checkMail({ status, userStatus, registrationType, templateType });
  });

  it('uses the paid confirmation variant after direct registration payment', async () => {
    await checkMail({
      status: 'CONFIRMED', userStatus: 'ACTIVE',
      registrationType: 'DIRECT_CONFIRMATION_AND_PAYMENT',
      templateType: 'REGISTRATION_CONFIRMED_PAID', paid: true,
    });
  });

  it('falls back to the default registration template', async () => {
    await checkMail({
      status: 'CONFIRMED', userStatus: 'ACTIVE', registrationType: 'DIRECT_CONFIRMATION',
      templateType: 'REGISTRATION_CONFIRMED', fallback: true,
    });
  });

  it('preserves the waitlist promotion email', async () => {
    await checkMail({
      status: 'CONFIRMED', userStatus: 'ACTIVE', registrationType: 'DIRECT_CONFIRMATION',
      templateType: 'WAITLIST_PROMOTED', oldStatus: 'WAITLIST',
    });
  });
});

async function checkMail({ status, userStatus, registrationType, templateType, paid, fallback, oldStatus }) {
  process.env.GUEST_TOKEN_SECRET = 'test-guest-token-secret';
  const request = jest.spyOn(GraphQLClient.prototype, 'request');
  const template = {
    subject: 'Confirmed: [Enrollment:CourseId--Course:Name]',
    content: '<html><body>Hello [User:FirstName]</body></html>',
    from: 'events@example.com', cc: null, bcc: null,
  };
  request.mockResolvedValueOnce({
    CourseEnrollment_by_pk: {
      id: 1, status,
      User: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', firstName: 'Test', email: 'test@example.com', status: userStatus },
      Course: { id: 101, title: 'Test event', registrationType },
      Invoices: paid ? [{ status: 'PAID' }] : [],
      CourseEnrollmentAddons: [],
    },
  });
  request.mockResolvedValueOnce({ MailTemplate: fallback ? [] : [template] });
  if (fallback) request.mockResolvedValueOnce({ MailTemplate: [template] });
  request.mockResolvedValueOnce({ AppSettings: [{ timeZone: 'Europe/Berlin' }] });
  request.mockResolvedValueOnce({ insert_MailLog_one: { id: 42 } });

  const { default: sendEnrollmentEmail } = await import('../index.js');
  const result = await sendEnrollmentEmail({ body: { event: {
    op: oldStatus ? 'UPDATE' : 'INSERT',
    data: { new: { id: 1, status }, old: oldStatus ? { id: 1, status: oldStatus } : null },
  } } }, mockLogger);

  expect(result).toMatchObject({ success: true, mailId: 42 });
  expect(request).toHaveBeenNthCalledWith(2, expect.any(String), { type: templateType, courseId: 101 });
  if (fallback) {
    expect(request).toHaveBeenNthCalledWith(3, expect.any(String), { type: templateType });
  }
  const mail = request.mock.calls.at(-1)[1];
  expect(mail).toMatchObject({ subject: 'Confirmed: Test event', to: 'test@example.com', status: 'READY_TO_SEND' });
  expect(mail.content).toContain('Hello Test');
  expect(mail.content.includes('/guest/manage?token=')).toBe(userStatus === 'GUEST');
}
