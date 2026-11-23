/**
 * @jest-environment node
 */
import { execSync } from 'child_process';

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

  it('falls back to git, and to no commit where git is unavailable', () => {
    // The dev container has neither git nor the repo's .git, so expect
    // whatever git itself reports here.
    let head: string | null = null;
    try {
      head = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      head = null;
    }
    expect(getManualVersion({}).commit).toBe(head);
  });
});
