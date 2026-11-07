import {
  getPrivacyNotice,
  isNoticeDue,
  PRIVACY_NOTICE_VERSION,
  PRIVACY_NOTICES,
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

  it('is due for accounts created on the version day, possibly before the deploy', () => {
    expect(isNoticeDue(`${PRIVACY_NOTICE_VERSION}T08:00:00+00:00`, null)).toBe(true);
  });

  it('is not due for accounts created after the version day', () => {
    expect(isNoticeDue('2999-01-01T08:00:00+00:00', null)).toBe(false);
  });

  it('is not due without a creation date', () => {
    expect(isNoticeDue(null, null)).toBe(false);
  });
});

describe('PRIVACY_NOTICES', () => {
  it('has a text in both languages for the notice version', () => {
    const notice = getPrivacyNotice(PRIVACY_NOTICE_VERSION);
    expect(notice?.de.trim()).toBeTruthy();
    expect(notice?.en.trim()).toBeTruthy();
  });

  it('is sorted newest first with unique ISO-date versions', () => {
    const versions = PRIVACY_NOTICES.map((notice) => notice.version);
    expect(versions).toEqual([...new Set(versions)].sort().reverse());
    versions.forEach((version) => expect(version).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('starts with the notice version, which is not newer than the policy', () => {
    expect(PRIVACY_NOTICES[0].version).toBe(PRIVACY_NOTICE_VERSION);
    expect(PRIVACY_NOTICE_VERSION <= PRIVACY_POLICY_VERSION).toBe(true);
  });
});
