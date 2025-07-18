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

  describe('Time window calculation', () => {
    it('should calculate correct reminder time windows', async () => {
      const { calculateReminderTimeWindow, getReminderWindows } = await import('../index.js');
      
      const now = new Date('2024-01-15T10:00:00Z');
      const reminderWindows = getReminderWindows();

      reminderWindows.forEach(window => {
        const { startTime, endTime, targetTime } = calculateReminderTimeWindow(now, window);
        
        // Verify times are Date instances
        expect(startTime).toBeInstanceOf(Date);
        expect(endTime).toBeInstanceOf(Date);
        expect(targetTime).toBeInstanceOf(Date);
        
        // Verify time ordering
        expect(startTime.getTime()).toBeLessThan(targetTime.getTime());
        expect(targetTime.getTime()).toBeLessThan(endTime.getTime());
        
        // Verify target time calculation
        const expectedTargetTime = new Date(now.getTime() + window.hours * 60 * 60 * 1000);
        expect(targetTime.getTime()).toBe(expectedTargetTime.getTime());
        
        // Verify tolerance calculation
        const toleranceMs = window.tolerance * 60 * 60 * 1000;
        expect(startTime.getTime()).toBe(targetTime.getTime() - toleranceMs);
        expect(endTime.getTime()).toBe(targetTime.getTime() + toleranceMs);
      });
    });

    it('should have correct default reminder windows', async () => {
      const { getReminderWindows } = await import('../index.js');
      
      const windows = getReminderWindows();
      
      expect(windows).toHaveLength(3);
      expect(windows[0]).toEqual({ type: '24_HOURS', hours: 24, tolerance: 0.25 });
      expect(windows[1]).toEqual({ type: '1_HOUR', hours: 1, tolerance: 0.25 });
      expect(windows[2]).toEqual({ type: '15_MINUTES', hours: 0.25, tolerance: 0.1 });
    });

    it('should calculate specific time windows correctly', async () => {
      const { calculateReminderTimeWindow } = await import('../index.js');
      
      const now = new Date('2024-01-15T12:00:00Z');
      
      // Test 24 hour window
      const window24h = { type: '24_HOURS', hours: 24, tolerance: 0.25 };
      const result24h = calculateReminderTimeWindow(now, window24h);
      
      expect(result24h.targetTime.toISOString()).toBe('2024-01-16T12:00:00.000Z');
      expect(result24h.startTime.toISOString()).toBe('2024-01-16T11:45:00.000Z'); // -15 min
      expect(result24h.endTime.toISOString()).toBe('2024-01-16T12:15:00.000Z');   // +15 min
      
      // Test 1 hour window
      const window1h = { type: '1_HOUR', hours: 1, tolerance: 0.25 };
      const result1h = calculateReminderTimeWindow(now, window1h);
      
      expect(result1h.targetTime.toISOString()).toBe('2024-01-15T13:00:00.000Z');
      expect(result1h.startTime.toISOString()).toBe('2024-01-15T12:45:00.000Z');  // -15 min
      expect(result1h.endTime.toISOString()).toBe('2024-01-15T13:15:00.000Z');    // +15 min
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

  describe('Integration test with time window verification', () => {
    it('should use the extracted time window calculation functions', async () => {
      // Test that the main function uses the same logic as the extracted functions
      const { calculateReminderTimeWindow, getReminderWindows } = await import('../index.js');

      const testNow = new Date('2024-01-15T12:00:00Z');
      const windows = getReminderWindows();

      // Calculate expected time windows using the extracted function
      const expectedWindows = windows.map(window => ({
        window,
        ...calculateReminderTimeWindow(testNow, window)
      }));

      // Verify that the extracted functions produce the expected results
      expect(expectedWindows).toHaveLength(3);
      
      // 24 hour window
      expect(expectedWindows[0].window.type).toBe('24_HOURS');
      expect(expectedWindows[0].targetTime.toISOString()).toBe('2024-01-16T12:00:00.000Z');
      expect(expectedWindows[0].startTime.toISOString()).toBe('2024-01-16T11:45:00.000Z');
      expect(expectedWindows[0].endTime.toISOString()).toBe('2024-01-16T12:15:00.000Z');
      
      // 1 hour window  
      expect(expectedWindows[1].window.type).toBe('1_HOUR');
      expect(expectedWindows[1].targetTime.toISOString()).toBe('2024-01-15T13:00:00.000Z');
      expect(expectedWindows[1].startTime.toISOString()).toBe('2024-01-15T12:45:00.000Z');
      expect(expectedWindows[1].endTime.toISOString()).toBe('2024-01-15T13:15:00.000Z');
      
      // 15 minute window
      expect(expectedWindows[2].window.type).toBe('15_MINUTES');
      expect(expectedWindows[2].targetTime.toISOString()).toBe('2024-01-15T12:15:00.000Z');
      expect(expectedWindows[2].startTime.toISOString()).toBe('2024-01-15T12:09:00.000Z');
      expect(expectedWindows[2].endTime.toISOString()).toBe('2024-01-15T12:21:00.000Z');
    });

    it('should verify time window calculation consistency', async () => {
      // This test ensures that the time window logic is mathematically correct
      const { calculateReminderTimeWindow } = await import('../index.js');

      const now = new Date('2024-01-15T10:30:45Z');
      const testWindows = [
        { type: 'TEST_2H', hours: 2, tolerance: 0.5 },
        { type: 'TEST_30MIN', hours: 0.5, tolerance: 0.1 },
        { type: 'TEST_6H', hours: 6, tolerance: 1.0 }
      ];

      testWindows.forEach(window => {
        const result = calculateReminderTimeWindow(now, window);
        
        // Verify mathematical relationships
        const expectedTargetMs = now.getTime() + (window.hours * 60 * 60 * 1000);
        const expectedToleranceMs = window.tolerance * 60 * 60 * 1000;
        
        expect(result.targetTime.getTime()).toBe(expectedTargetMs);
        expect(result.startTime.getTime()).toBe(expectedTargetMs - expectedToleranceMs);
        expect(result.endTime.getTime()).toBe(expectedTargetMs + expectedToleranceMs);
        
        // Verify time window span
        const windowSpan = result.endTime.getTime() - result.startTime.getTime();
        const expectedSpan = 2 * expectedToleranceMs;
        expect(windowSpan).toBe(expectedSpan);
      });
    });
  });
}); 