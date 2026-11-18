import type { Profile } from 'next-auth';

const HASURA_CLAIMS = 'https://hasura.io/jwt/claims';

/**
 * The session's `profile` is captured once, at sign-in, and the client picks its Hasura role from
 * the roles in it. A role granted later - e.g. `instructor`, added in Keycloak when someone is made
 * a course instructor - only appears in the access tokens Keycloak issues on refresh. Without
 * copying it across, the client keeps requesting as `user` until the next sign-in, and queries
 * that need the new role fail validation (e.g. ManagedCourse's Session.attendanceData).
 *
 * Returns the profile with the Hasura claims of the given access token, or the profile unchanged
 * when the token carries none. The token comes straight from Keycloak's token endpoint, so it is
 * read here without verifying its signature; Hasura verifies it on every request.
 */
export const withRefreshedHasuraClaims = (profile: Profile | undefined, accessToken: string): Profile | undefined => {
  if (!profile) return profile;
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
    const claims = payload?.[HASURA_CLAIMS];
    if (!claims || typeof claims !== 'object') return profile;
    return { ...profile, [HASURA_CLAIMS]: claims };
  } catch {
    return profile;
  }
};
