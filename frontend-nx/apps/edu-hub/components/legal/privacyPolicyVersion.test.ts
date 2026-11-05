import {
  getPrivacyPolicyChange,
  isNoticeDue,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_POLICY_CHANGES,
  PRIVACY_POLICY_VERSION,
} from './privacyPolicyVersion';

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

describe('PRIVACY_POLICY_CHANGES', () => {
  it('has an entry for the current version and for the notice version', () => {
    expect(getPrivacyPolicyChange(PRIVACY_POLICY_VERSION)).not.toBeNull();
    expect(getPrivacyPolicyChange(PRIVACY_NOTICE_VERSION)).not.toBeNull();
  });

  it('is sorted newest first with unique ISO-date versions and both languages', () => {
    const versions = PRIVACY_POLICY_CHANGES.map((change) => change.version);
    expect(versions).toEqual([...new Set(versions)].sort().reverse());
    PRIVACY_POLICY_CHANGES.forEach((change) => {
      expect(change.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(change.de.trim()).not.toBe('');
      expect(change.en.trim()).not.toBe('');
    });
  });

  it('starts with the current version', () => {
    expect(PRIVACY_POLICY_CHANGES[0].version).toBe(PRIVACY_POLICY_VERSION);
  });
});
