import { jest } from '@jest/globals';

const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('Email System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module loading', () => {
    it('should load both email functions successfully', async () => {
      const { default: sendEnrollmentEmail } = await import('../sendEnrollmentEmail/index.js');
      const { default: sendSessionReminders } = await import('../sendSessionReminders/index.js');
      
      expect(typeof sendEnrollmentEmail).toBe('function');
      expect(typeof sendSessionReminders).toBe('function');
    });
  });

  describe('sendProjectEmail routing (no GraphQL needed)', () => {
    it('should skip DELETE operations', async () => {
      const { default: sendProjectEmail } = await import('../sendProjectEmail/index.js');
      const res = await sendProjectEmail(
        { body: { table: { name: 'Project' }, event: { op: 'DELETE', data: { new: null, old: { id: 1 } } } } },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });

    it('should skip Project updates with unchanged status', async () => {
      const { default: sendProjectEmail } = await import('../sendProjectEmail/index.js');
      const res = await sendProjectEmail(
        {
          body: {
            table: { name: 'Project' },
            event: { op: 'UPDATE', data: { new: { id: 1, status: 'ONGOING' }, old: { id: 1, status: 'ONGOING' } } },
          },
        },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });

    it('should not email on ProjectAuthor insert that is not REQUESTED', async () => {
      const { default: sendProjectEmail } = await import('../sendProjectEmail/index.js');
      const res = await sendProjectEmail(
        {
          body: {
            table: { name: 'ProjectAuthor' },
            event: { op: 'INSERT', data: { new: { projectId: 1, userId: 'u1', participationStatus: 'ACCEPTED' }, old: null } },
          },
        },
        mockLogger
      );
      expect(res.success).toBe(true);
      // ACCEPTED on INSERT is a self-proposed author, not a join request -> no email
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });
  });

  describe('sendCourseUpdateEmail routing (no GraphQL needed)', () => {
    it('should skip non-UPDATE operations', async () => {
      const { default: sendCourseUpdateEmail } = await import('../sendCourseUpdateEmail/index.js');
      const res = await sendCourseUpdateEmail(
        { body: { table: { name: 'Session' }, event: { op: 'INSERT', data: { new: { Id: 1 }, old: null } } } },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });

    it('should skip Session updates that do not change timing', async () => {
      const { default: sendCourseUpdateEmail } = await import('../sendCourseUpdateEmail/index.js');
      const res = await sendCourseUpdateEmail(
        {
          body: {
            table: { name: 'Session' },
            event: {
              op: 'UPDATE',
              data: {
                new: { courseId: 1, startDateTime: '2024-01-01T10:00:00Z', endDateTime: '2024-01-01T12:00:00Z' },
                old: { courseId: 1, startDateTime: '2024-01-01T10:00:00Z', endDateTime: '2024-01-01T12:00:00Z' },
              },
            },
          },
        },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });

    it('should skip Invoice updates that are not a fresh transition to PAID', async () => {
      const { default: sendCourseUpdateEmail } = await import('../sendCourseUpdateEmail/index.js');
      const res = await sendCourseUpdateEmail(
        {
          body: {
            table: { name: 'Invoice' },
            event: { op: 'UPDATE', data: { new: { status: 'ISSUED', courseEnrollmentId: 5 }, old: { status: 'DRAFT' } } },
          },
        },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });

    it('should skip PAID invoices with no linked course enrollment', async () => {
      const { default: sendCourseUpdateEmail } = await import('../sendCourseUpdateEmail/index.js');
      const res = await sendCourseUpdateEmail(
        {
          body: {
            table: { name: 'Invoice' },
            event: { op: 'UPDATE', data: { new: { status: 'PAID', courseEnrollmentId: null }, old: { status: 'ISSUED' } } },
          },
        },
        mockLogger
      );
      expect(res.success).toBe(true);
      expect(res.messageKey).toBe('NO_ACTION_NEEDED');
    });
  });

  describe('Function behavior without GraphQL', () => {
    it('should handle enrollment email edge cases', async () => {
      const { default: sendEnrollmentEmail } = await import('../sendEnrollmentEmail/index.js');
      
      // Test DELETE operation (should be skipped)
      const deleteReq = {
        body: {
          event: {
            op: 'DELETE',
            data: { new: { id: 1 }, old: null }
          }
        }
      };

      const deleteResult = await sendEnrollmentEmail(deleteReq, mockLogger);
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.messageKey).toBe('NO_ACTION_NEEDED');

      // Test unchanged status (Hasura filters these in practice)
      const unchangedReq = {
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

      const unchangedResult = await sendEnrollmentEmail(unchangedReq, mockLogger);
      // Function will attempt to process but fail due to missing GraphQL setup in test
      expect(unchangedResult.success).toBe(false);
      expect(unchangedResult.messageKey).toBe('EMAIL_PROCESSING_FAILED');
    });

    it('should handle session reminders error cases', async () => {
      const { default: sendSessionReminders } = await import('../sendSessionReminders/index.js');
      
      const req = { body: {} };
      const result = await sendSessionReminders(req, mockLogger);
      
      // Should fail gracefully without GraphQL connection
      expect(result.success).toBe(false);
      expect(result.messageKey).toBe('SESSION_REMINDERS_FAILED');
      expect(result.error).toBeDefined();
    });
  });

  describe('Error resilience', () => {
    it('should demonstrate independent error handling', async () => {
      const { default: sendEnrollmentEmail } = await import('../sendEnrollmentEmail/index.js');
      const { default: sendSessionReminders } = await import('../sendSessionReminders/index.js');
      
      // Even if one function encounters an error, the other should still work for valid inputs
      const validEnrollmentReq = {
        body: {
          event: {
            op: 'DELETE',
            data: { new: { id: 1 }, old: null }
          }
        }
      };

      const enrollmentResult = await sendEnrollmentEmail(validEnrollmentReq, mockLogger);
      expect(enrollmentResult.success).toBe(true);

      // Session reminders will error due to GraphQL, but that's isolated
      const reminderReq = { body: {} };
      const reminderResult = await sendSessionReminders(reminderReq, mockLogger);
      expect(reminderResult.success).toBe(false);

      // Both functions are independent - one failing doesn't affect the other
      expect(enrollmentResult.success).not.toBe(reminderResult.success);
    });
  });

  describe('Logging consistency', () => {
    it('should demonstrate consistent logging patterns', async () => {
      const { default: sendEnrollmentEmail } = await import('../sendEnrollmentEmail/index.js');
      const { default: sendSessionReminders } = await import('../sendSessionReminders/index.js');
      
      const enrollmentReq = {
        body: {
          event: {
            op: 'DELETE',
            data: { new: { id: 1 }, old: null }
          }
        }
      };

      await sendEnrollmentEmail(enrollmentReq, mockLogger);
      expect(mockLogger.info).toHaveBeenCalledWith('########## Send Enrollment Email ##########');

      jest.clearAllMocks();

      const reminderReq = { body: {} };
      await sendSessionReminders(reminderReq, mockLogger);
      expect(mockLogger.info).toHaveBeenCalledWith('########## Send Session Reminders ##########');
    });
  });
}); 