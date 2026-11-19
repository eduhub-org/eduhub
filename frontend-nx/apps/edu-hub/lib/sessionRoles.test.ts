/**
 * @jest-environment node
 */
import type { Profile } from 'next-auth';

import { withRefreshedHasuraClaims } from './sessionRoles';

const CLAIMS = 'https://hasura.io/jwt/claims';

const tokenWith = (payload: object) =>
  ['header', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'signature'].join('.');

// Signed in before being made a course instructor.
const signInProfile = {
  email: 'instructor@example.com',
  given_name: 'Ina',
  family_name: 'Structor',
  preferred_username: 'instructor@example.com',
  email_verified: true,
  [CLAIMS]: {
    'x-hasura-allowed-roles': ['user'],
    'x-hasura-default-role': 'user',
    'x-hasura-user-id': 'u-1',
  },
} as Profile;

describe('withRefreshedHasuraClaims', () => {
  it('picks up a role granted after sign-in', () => {
    const refreshedClaims = {
      'x-hasura-allowed-roles': ['user', 'instructor'],
      'x-hasura-default-role': 'user',
      'x-hasura-user-id': 'u-1',
    };

    const profile = withRefreshedHasuraClaims(signInProfile, tokenWith({ [CLAIMS]: refreshedClaims }));

    expect(profile?.[CLAIMS]).toEqual(refreshedClaims);
    expect(profile?.email).toBe('instructor@example.com');
  });

  it('keeps the profile when the token has no Hasura claims', () => {
    expect(withRefreshedHasuraClaims(signInProfile, tokenWith({ sub: 'u-1' }))).toBe(signInProfile);
  });

  it('keeps the profile when the token cannot be read', () => {
    expect(withRefreshedHasuraClaims(signInProfile, 'not-a-jwt')).toBe(signInProfile);
  });
});
