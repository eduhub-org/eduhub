/**
 * @jest-environment node
 */
import { getManualVersion } from '../version';

const SHA = '691b4b179d2a7c0f3b1c2d4e5f60718293a4b5c6';

describe('getManualVersion', () => {
  it('uses the release tag and commit passed in by CI', () => {
    expect(getManualVersion({ GIT_COMMIT: SHA, GIT_REF: 'v2.44.0' })).toEqual({ release: 'v2.44.0', commit: SHA });
  });

  it('has no release for branch builds', () => {
    expect(getManualVersion({ GIT_COMMIT: SHA, GIT_REF: 'staging' })).toEqual({ release: null, commit: SHA });
  });

  it('ignores a value that is not a commit hash', () => {
    expect(getManualVersion({ GIT_COMMIT: 'not a sha', GIT_REF: 'develop' }).commit).toBeNull();
  });

  it('falls back to git in a local checkout', () => {
    expect(getManualVersion({}).commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
