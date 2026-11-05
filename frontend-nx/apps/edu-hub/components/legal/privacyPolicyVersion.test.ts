import { isNoticeDue, PRIVACY_NOTICE_VERSION } from './privacyPolicyVersion';

describe('isNoticeDue', () => {
  const before = '2020-01-01T10:00:00+00:00';

  it('is due for an account created before the notice version that never dismissed one', () => {
    expect(isNoticeDue(before, null)).toBe(true);
  });

  it('is due when only an older notice was dismissed', () => {
    expect(isNoticeDue(before, '2020-06-01')).toBe(true);
  });

  it('is not due once this version (or a later one) was dismissed', () => {
    expect(isNoticeDue(before, PRIVACY_NOTICE_VERSION)).toBe(false);
    expect(isNoticeDue(before, '2999-01-01')).toBe(false);
  });

  it('is not due for accounts created on or after the version date', () => {
    expect(isNoticeDue(`${PRIVACY_NOTICE_VERSION}T08:00:00+00:00`, null)).toBe(false);
  });

  it('is not due without a creation date', () => {
    expect(isNoticeDue(null, null)).toBe(false);
  });
});
