import { describe, expect, it } from '@jest/globals';

// The module reads GUEST_TOKEN_SECRET at call time, but set it before importing
// so the import itself can never depend on ordering.
process.env.GUEST_TOKEN_SECRET = 'test-guest-token-secret';

const {
  buildManageToken,
  verifyManageToken,
  hashToken,
  generateRawToken,
  escapeLikePattern,
  isValidEmail,
  isValidName,
  normalizeEmail,
  normalizeName,
  GUEST_ALLOWED_REGISTRATION_TYPES,
} = await import('../guestRegistration.js');

const USER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('manage tokens', () => {
  it('round-trips a user id', () => {
    expect(verifyManageToken(buildManageToken(USER_ID))).toBe(USER_ID);
  });

  it('is deterministic, so any mailer can regenerate the same link', () => {
    expect(buildManageToken(USER_ID)).toBe(buildManageToken(USER_ID));
  });

  it('rejects a token signed for a different user', () => {
    const other = '11111111-2222-3333-4444-555555555555';
    const forged = `${USER_ID}.${buildManageToken(other).split('.')[1]}`;
    expect(verifyManageToken(forged)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const [id, signature] = buildManageToken(USER_ID).split('.');
    expect(verifyManageToken(`${id}.${signature.slice(0, -1)}X`)).toBeNull();
  });

  it('rejects a truncated signature without throwing on length mismatch', () => {
    const [id, signature] = buildManageToken(USER_ID).split('.');
    expect(verifyManageToken(`${id}.${signature.slice(0, 5)}`)).toBeNull();
  });

  it('rejects malformed and non-string input', () => {
    for (const value of ['', 'no-separator', '.onlysignature', null, undefined, 42, {}]) {
      expect(verifyManageToken(value)).toBeNull();
    }
  });

  it('changes when the signing secret changes', () => {
    const original = buildManageToken(USER_ID);
    process.env.GUEST_TOKEN_SECRET = 'a-different-secret';
    const rotated = buildManageToken(USER_ID);
    expect(rotated).not.toBe(original);
    // A link minted under the old secret must stop working after rotation.
    expect(verifyManageToken(original)).toBeNull();
    process.env.GUEST_TOKEN_SECRET = 'test-guest-token-secret';
  });
});

describe('confirmation tokens', () => {
  it('produces a distinct high-entropy token each time', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateRawToken()));
    expect(tokens.size).toBe(50);
    expect(generateRawToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashes deterministically and does not return the raw token', () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(raw)).not.toContain(raw);
  });
});

describe('input normalization', () => {
  it('lowercases and trims emails so one address cannot yield two guest records', () => {
    expect(normalizeEmail('  Guest@Example.COM ')).toBe('guest@example.com');
  });

  it('collapses whitespace in names', () => {
    expect(normalizeName('  Ada   Lovelace ')).toBe('Ada Lovelace');
  });

  it('accepts ordinary addresses and rejects obvious nonsense', () => {
    expect(isValidEmail('guest@example.com')).toBe(true);
    expect(isValidEmail('guest+tag@sub.example.co.uk')).toBe(true);
    for (const bad of ['', 'guest', 'guest@', '@example.com', 'a b@example.com', 'guest@example']) {
      expect(isValidEmail(bad)).toBe(false);
    }
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false);
  });

  it('bounds name length', () => {
    expect(isValidName('A')).toBe(true);
    expect(isValidName('')).toBe(false);
    expect(isValidName('x'.repeat(101))).toBe(false);
  });
});

describe('LIKE escaping', () => {
  it('escapes the metacharacters that would widen an _ilike lookup', () => {
    // `_` is legal in an email local part and matches any character in LIKE, so
    // an unescaped address could resolve to somebody else's account.
    expect(escapeLikePattern('first_last@example.com')).toBe('first\\_last@example.com');
    expect(escapeLikePattern('a%b@example.com')).toBe('a\\%b@example.com');
    expect(escapeLikePattern('back\\slash@example.com')).toBe('back\\\\slash@example.com');
  });

  it('leaves ordinary addresses untouched', () => {
    expect(escapeLikePattern('guest@example.com')).toBe('guest@example.com');
    expect(escapeLikePattern('guest+tag@example.com')).toBe('guest+tag@example.com');
  });

  it('handles null and undefined', () => {
    expect(escapeLikePattern(null)).toBe('');
    expect(escapeLikePattern(undefined)).toBe('');
  });
});

describe('allowed registration types', () => {
  it('permits only direct registration', () => {
    expect(GUEST_ALLOWED_REGISTRATION_TYPES.has('DIRECT_CONFIRMATION')).toBe(true);
    expect(GUEST_ALLOWED_REGISTRATION_TYPES.has('DIRECT_WITH_INPUT')).toBe(true);
  });

  it('excludes approval workflows and everything involving payment', () => {
    for (const type of [
      'APPROVAL_WITH_INPUT',
      'DIRECT_CONFIRMATION_AND_PAYMENT',
      'DIRECT_WITH_INPUT_AND_PAYMENT',
      'EXTERNAL_REGISTRATION',
    ]) {
      expect(GUEST_ALLOWED_REGISTRATION_TYPES.has(type)).toBe(false);
    }
  });
});
