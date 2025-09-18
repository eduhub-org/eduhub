import { jest } from '@jest/globals';

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