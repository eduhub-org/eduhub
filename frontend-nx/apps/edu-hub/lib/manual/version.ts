import { execSync } from 'child_process';

/** What the manual (and the app) was built from, shown on every /help page. */
export interface ManualVersion {
  /** The release tag, e.g. "v2.44.0", when the build is a release. */
  release: string | null;
  /** The full commit hash, when known. */
  commit: string | null;
}

const RELEASE_TAG = /^v\d+\.\d+\.\d+$/;

const git = (args: string): string | null => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
  } catch {
    return null;
  }
};

/**
 * CI passes GIT_COMMIT and GIT_REF into the image build (the Docker build has
 * no .git). Local builds ask git; without either the version stays unknown.
 */
export const getManualVersion = (
  env: Partial<NodeJS.ProcessEnv> = process.env
): ManualVersion => {
  const commit = env.GIT_COMMIT || git('rev-parse HEAD');
  const ref = env.GIT_REF || (env.GIT_COMMIT ? null : git('describe --tags --exact-match HEAD'));
  return {
    commit: commit && /^[0-9a-f]{7,40}$/.test(commit) ? commit : null,
    release: ref && RELEASE_TAG.test(ref) ? ref : null,
  };
};
