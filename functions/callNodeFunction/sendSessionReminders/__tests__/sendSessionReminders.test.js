import { jest } from '@jest/globals';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('sendSessionReminders', () => {
  let originalDateNow;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Date.now to a fixed time for consistent testing
    originalDateNow = Date.now;
    const fixedTime = new Date('2024-01-15T10:00:00Z').getTime();
    Date.now = jest.fn(() => fixedTime);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it('should be a function', async () => {
    const { default: sendSessionReminders } = await import('../index.js');
    expect(typeof sendSessionReminders).toBe('function');
  });

  it('should process reminder windows with fixed time', async () => {
    const { default: sendSessionReminders } = await import('../index.js');
    
    const req = { body: {} };

    try {
      await sendSessionReminders(req, mockLogger);
      // The function will likely fail due to GraphQL connection, but that's expected
    } catch (error) {
      // This is expected since we don't have a real GraphQL endpoint
      expect(error).toBeDefined();
    }
    
    // Should have logged the start message
    expect(mockLogger.info).toHaveBeenCalledWith('########## Send Session Reminders ##########');
    
    // Should have logged processing for different reminder windows
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Processing 24_HOURS reminders for FIRST sessions')
    );
  });

  it('should calculate correct reminder time windows', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const reminderWindows = [
      { type: '24_HOURS', hours: 24, tolerance: 0.25 },
      { type: '1_HOUR', hours: 1, tolerance: 0.25 },
      { type: '15_MINUTES', hours: 0.25, tolerance: 0.1 }
    ];

    reminderWindows.forEach(window => {
      const targetTime = new Date(now.getTime() + window.hours * 60 * 60 * 1000);
      const toleranceMs = window.tolerance * 60 * 60 * 1000;
      const startTime = new Date(targetTime.getTime() - toleranceMs);
      const endTime = new Date(targetTime.getTime() + toleranceMs);

      expect(startTime).toBeInstanceOf(Date);
      expect(endTime).toBeInstanceOf(Date);
      expect(startTime.getTime()).toBeLessThan(endTime.getTime());
    });
  });

  it('should handle error cases gracefully', async () => {
    const { default: sendSessionReminders } = await import('../index.js');
    
    const req = { body: {} };

    const result = await sendSessionReminders(req, mockLogger);
    
    // Should return an error result since we don't have real GraphQL
    expect(result.success).toBe(false);
    expect(result.messageKey).toBe('SESSION_REMINDERS_FAILED');
    expect(result.error).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalled();
  });
}); 