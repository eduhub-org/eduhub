import { nextSessionTimes } from './sessionDefaults';

const NOW = new Date('2025-09-12T14:30:00');

describe('nextSessionTimes', () => {
  it('repeats the previous session a week later', () => {
    const { startTime, endTime } = nextSessionTimes(
      { startTime: '18:00', endTime: '20:00' },
      { startDateTime: '2025-09-10T16:00:00Z', endDateTime: '2025-09-10T18:00:00Z' },
      false,
      NOW
    );
    expect(startTime.toISOString()).toBe('2025-09-17T16:00:00.000Z');
    expect(endTime.toISOString()).toBe('2025-09-17T18:00:00.000Z');
  });

  it('uses the weekly times for a first course session', () => {
    const { startTime, endTime } = nextSessionTimes({ startTime: '18:00', endTime: '20:00' }, undefined, false, NOW);
    expect(startTime.getHours()).toBe(18);
    expect(endTime.getHours()).toBe(20);
  });

  it('starts a first event session at the next full hour for two hours', () => {
    const { startTime, endTime } = nextSessionTimes({ startTime: null, endTime: null }, undefined, true, NOW);
    expect(startTime.getHours()).toBe(15);
    expect(startTime.getMinutes()).toBe(0);
    expect(endTime.getHours()).toBe(17);
  });

  // Regression: an event hides the weekly time controls without clearing them,
  // so a stale endTime could land before the generated start.
  it('never produces an end before the start for an event with only a stale endTime', () => {
    const { startTime, endTime } = nextSessionTimes({ startTime: null, endTime: '09:00' }, undefined, true, NOW);
    expect(startTime.getHours()).toBe(15);
    expect(endTime.getTime()).toBeGreaterThan(startTime.getTime());
    expect(endTime.getHours()).toBe(17);
  });

  it('leaves a course with a stale endTime alone', () => {
    const { startTime, endTime } = nextSessionTimes({ startTime: null, endTime: '09:00' }, undefined, false, NOW);
    expect(startTime.getHours()).toBe(0);
    expect(endTime.getHours()).toBe(9);
  });
});
