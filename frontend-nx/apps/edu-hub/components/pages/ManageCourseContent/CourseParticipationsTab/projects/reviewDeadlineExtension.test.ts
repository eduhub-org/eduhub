import {
  getExtensionBaseDate,
  getRelativeDeadline,
  isCustomDeadlineValid,
  isDeadlineSelectionConfirmable,
  resolveExtendedDeadline,
  toDateInputValue,
} from './reviewDeadlineExtension';

/** Fixed "today" for every case below. */
const NOW = new Date(2026, 7, 21); // 21.08.2026

describe('getExtensionBaseDate', () => {
  it('counts from a deadline that is still ahead', () => {
    expect(toDateInputValue(getExtensionBaseDate('2026-09-01', NOW))).toBe('2026-09-01');
  });

  it('counts from today when the deadline has already passed', () => {
    expect(toDateInputValue(getExtensionBaseDate('2026-08-01', NOW))).toBe('2026-08-21');
  });

  it('counts from today when there is no deadline at all', () => {
    expect(toDateInputValue(getExtensionBaseDate(null, NOW))).toBe('2026-08-21');
  });
});

describe('getRelativeDeadline', () => {
  it('adds a week to a running deadline', () => {
    expect(getRelativeDeadline('plus_1_week', '2026-09-01', NOW)).toBe('2026-09-08');
  });

  it('adds two weeks from today when the deadline has passed', () => {
    expect(getRelativeDeadline('plus_2_weeks', '2026-08-01', NOW)).toBe('2026-09-04');
  });

  it('crosses month and year boundaries', () => {
    expect(getRelativeDeadline('plus_2_weeks', '2026-12-28', NOW)).toBe('2027-01-11');
  });
});

describe('isCustomDeadlineValid', () => {
  it('accepts today', () => {
    expect(isCustomDeadlineValid('2026-08-21', NOW)).toBe(true);
  });

  it('rejects yesterday', () => {
    expect(isCustomDeadlineValid('2026-08-20', NOW)).toBe(false);
  });

  it('rejects an empty or impossible date', () => {
    expect(isCustomDeadlineValid('', NOW)).toBe(false);
    expect(isCustomDeadlineValid('2026-02-31', NOW)).toBe(false);
  });
});

describe('resolveExtendedDeadline', () => {
  const base = { effectiveDeadlineIso: '2026-08-01', now: NOW };

  it('writes nothing when the deadline is kept', () => {
    expect(resolveExtendedDeadline({ ...base, choice: 'keep', customDate: '' })).toBeNull();
  });

  it('writes nothing while no choice has been made', () => {
    expect(resolveExtendedDeadline({ ...base, choice: '', customDate: '' })).toBeNull();
  });

  it('resolves a relative choice to a date', () => {
    expect(resolveExtendedDeadline({ ...base, choice: 'plus_1_week', customDate: '' })).toBe(
      '2026-08-28'
    );
  });

  it('passes a valid custom date through unchanged', () => {
    expect(
      resolveExtendedDeadline({ ...base, choice: 'custom', customDate: '2026-10-05' })
    ).toBe('2026-10-05');
  });

  it('never writes an invalid custom date', () => {
    expect(
      resolveExtendedDeadline({ ...base, choice: 'custom', customDate: '2026-01-01' })
    ).toBeNull();
  });
});

describe('isDeadlineSelectionConfirmable', () => {
  it('allows confirming without a choice while the deadline is still running', () => {
    expect(
      isDeadlineSelectionConfirmable({
        choice: '',
        customDate: '',
        isDeadlinePassed: false,
        now: NOW,
      })
    ).toBe(true);
  });

  it('forces a decision once the deadline has passed', () => {
    expect(
      isDeadlineSelectionConfirmable({
        choice: '',
        customDate: '',
        isDeadlinePassed: true,
        now: NOW,
      })
    ).toBe(false);
  });

  it('accepts a deliberate "keep" even on a passed deadline', () => {
    expect(
      isDeadlineSelectionConfirmable({
        choice: 'keep',
        customDate: '',
        isDeadlinePassed: true,
        now: NOW,
      })
    ).toBe(true);
  });

  it('blocks an empty or past custom date', () => {
    expect(
      isDeadlineSelectionConfirmable({
        choice: 'custom',
        customDate: '',
        isDeadlinePassed: false,
        now: NOW,
      })
    ).toBe(false);
    expect(
      isDeadlineSelectionConfirmable({
        choice: 'custom',
        customDate: '2026-08-20',
        isDeadlinePassed: false,
        now: NOW,
      })
    ).toBe(false);
  });
});
