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
  classifyGuestThrottle,
  findUsersByEmail,
  appendGuestMailFooter,
  isHoneypotTripped,
  GUEST_THROTTLE,
  NO_SUCH_USER_ID,
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

describe('honeypot', () => {
  it('trips on anything a bot would type', () => {
    expect(isHoneypotTripped('http://spam.example')).toBe(true);
    expect(isHoneypotTripped('   x  ')).toBe(true);
  });

  it('does not trip on what a person leaves behind', () => {
    // A real submission never touches the field, so empty, whitespace-only,
    // and absent must all pass.
    expect(isHoneypotTripped('')).toBe(false);
    expect(isHoneypotTripped('   ')).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
  });
});

describe('registration throttling', () => {
  it('lets an ordinary submission through', () => {
    expect(classifyGuestThrottle({ perAddressCourse: 0, perAddress: 0, perCourse: 0, global: 0 }))
      .toBeNull();
    expect(classifyGuestThrottle({})).toBeNull();
  });

  it('blocks at each ceiling independently', () => {
    expect(classifyGuestThrottle({ perAddressCourse: GUEST_THROTTLE.perAddressCourse }))
      .toBe('ADDRESS');
    expect(classifyGuestThrottle({ perAddress: GUEST_THROTTLE.perAddress })).toBe('ADDRESS');
    expect(classifyGuestThrottle({ perCourse: GUEST_THROTTLE.perCourse })).toBe('PUBLIC');
    expect(classifyGuestThrottle({ global: GUEST_THROTTLE.global })).toBe('PUBLIC');
  });

  it('allows the submission that reaches one below the ceiling', () => {
    expect(classifyGuestThrottle({ perAddressCourse: GUEST_THROTTLE.perAddressCourse - 1 }))
      .toBeNull();
    expect(classifyGuestThrottle({ perAddress: GUEST_THROTTLE.perAddress - 1 })).toBeNull();
    expect(classifyGuestThrottle({ perCourse: GUEST_THROTTLE.perCourse - 1 })).toBeNull();
    expect(classifyGuestThrottle({ global: GUEST_THROTTLE.global - 1 })).toBeNull();
  });

  it('lets one address sign up for several different events', () => {
    // The narrow cap is per address *and* course. A flat per-address cap of 3
    // silently dropped the fourth event someone signed up for at an open day.
    const oneEachForFourEvents = { perAddressCourse: 1, perAddress: 4 };
    expect(classifyGuestThrottle(oneEachForFourEvents)).toBeNull();
  });

  it('still stops one address hammering a single event', () => {
    expect(classifyGuestThrottle({ perAddressCourse: GUEST_THROTTLE.perAddressCourse, perAddress: 3 }))
      .toBe('ADDRESS');
  });

  it('classifies address-keyed ceilings separately from public ones', () => {
    // Reporting an address-keyed ceiling would tell an unauthenticated caller
    // how often that address signed up recently, which is the enumeration leak
    // the uniform success payload exists to close. The event and platform
    // ceilings describe neither the address nor its owner.
    expect(classifyGuestThrottle({ perAddressCourse: GUEST_THROTTLE.perAddressCourse }))
      .toBe('ADDRESS');
    expect(classifyGuestThrottle({ perAddress: GUEST_THROTTLE.perAddress })).toBe('ADDRESS');
    expect(classifyGuestThrottle({ perCourse: GUEST_THROTTLE.perCourse })).toBe('PUBLIC');
    expect(classifyGuestThrottle({ global: GUEST_THROTTLE.global })).toBe('PUBLIC');
  });

  it('prefers the address verdict when an address and a public cap trip together', () => {
    // Answering PUBLIC here would disclose the address-keyed fact by omission.
    expect(
      classifyGuestThrottle({
        perAddress: GUEST_THROTTLE.perAddress,
        perCourse: GUEST_THROTTLE.perCourse,
      })
    ).toBe('ADDRESS');
  });

  it('orders the ceilings narrowest to widest', () => {
    // A wider cap at or below a narrower one would make the narrower one
    // unreachable.
    expect(GUEST_THROTTLE.perAddressCourse).toBeLessThan(GUEST_THROTTLE.perAddress);
    expect(GUEST_THROTTLE.perAddress).toBeLessThan(GUEST_THROTTLE.perCourse);
    expect(GUEST_THROTTLE.perCourse).toBeLessThan(GUEST_THROTTLE.global);
  });

  it('uses a sentinel user id that no generated uuid can collide with', () => {
    // Hasura reads `{_eq: null}` as "no condition", so a null here would count
    // every token in the window instead of none.
    expect(NO_SUCH_USER_ID).toBe('00000000-0000-0000-0000-000000000000');
  });
});

describe('guest mail footer', () => {
  // Three senders append this, and it is a guest's only route to their own data,
  // so the rules it follows are worth pinning down.
  const GUEST = { id: USER_ID, status: 'GUEST' };
  const silent = { error: () => {} };

  it('adds the manage link for a guest', () => {
    const out = appendGuestMailFooter('<html><body><p>hi</p></body></html>', GUEST, silent);
    expect(out).toContain('/guest/manage?token=');
    expect(out).toContain(USER_ID);
  });

  it('places the footer inside the document, not after it', () => {
    // Plain concatenation left the markup dangling past </html>. Clients render
    // it either way, but invalid structure is cheap spam-filter signal.
    const out = appendGuestMailFooter('<html><body><p>hi</p></body></html>', GUEST, silent);
    expect(out.indexOf('/guest/manage')).toBeLessThan(out.indexOf('</body>'));
    expect(out.trimEnd().endsWith('</html>')).toBe(true);
  });

  it('falls back to appending when there is no closing tag', () => {
    expect(appendGuestMailFooter('<p>hi</p>', GUEST, silent)).toContain('/guest/manage');
  });

  it('leaves mail to everyone else untouched', () => {
    // The same templates serve logged-in users, for whom the link means nothing.
    for (const status of ['ACTIVE', 'INACTIVE', 'DELETED', undefined]) {
      const body = '<html><body><p>hi</p></body></html>';
      expect(appendGuestMailFooter(body, { id: USER_ID, status }, silent)).toBe(body);
    }
    expect(appendGuestMailFooter('<p>x</p>', null, silent)).toBe('<p>x</p>');
  });

  it('returns the mail unchanged rather than throwing when the secret is missing', () => {
    // A reminder without the footer beats a reminder that never arrives.
    const original = process.env.GUEST_TOKEN_SECRET;
    delete process.env.GUEST_TOKEN_SECRET;
    let logged = '';
    try {
      expect(appendGuestMailFooter('<p>hi</p>', GUEST, { error: (m) => (logged = m) })).toBe('<p>hi</p>');
      expect(logged).toContain('GUEST_TOKEN_SECRET');
    } finally {
      process.env.GUEST_TOKEN_SECRET = original;
    }
  });
});

describe('resolving an address to its rows', () => {
  // The one lookup that decides whether the "you already have an account" guard
  // fires. It used to be `limit: 1` with no ordering, so when an address held
  // both a guest record and an account, Postgres picked between them and the
  // guard was skipped whenever the guest row happened to come back first.
  const clientReturning = (rows) => ({ request: async () => ({ User: rows }) });

  const GUEST = { id: 'g1', status: 'GUEST', firstName: 'Gast', lastName: 'Row' };
  const ACCOUNT = { id: 'a1', status: 'ACTIVE', firstName: 'Real', lastName: 'Account' };

  it('finds the account even when the guest row is listed first', async () => {
    const { account, guest } = await findUsersByEmail(clientReturning([GUEST, ACCOUNT]), 'a@b.co');
    expect(account).toBe(ACCOUNT);
    expect(guest).toBe(GUEST);
  });

  it('finds the account when it is listed first', async () => {
    const { account, guest } = await findUsersByEmail(clientReturning([ACCOUNT, GUEST]), 'a@b.co');
    expect(account).toBe(ACCOUNT);
    expect(guest).toBe(GUEST);
  });

  it('treats suspended accounts as accounts', async () => {
    // The reason this cannot be an `order_by: {status: asc}`: both INACTIVE and
    // SPAM sort *after* GUEST alphabetically, so ordering would have handed back
    // the guest row and skipped the guard for exactly these users.
    for (const status of ['INACTIVE', 'SPAM']) {
      const rows = [GUEST, { ...ACCOUNT, status }];
      const { account } = await findUsersByEmail(clientReturning(rows), 'a@b.co');
      expect(account?.status).toBe(status);
    }
  });

  it('does not mistake an anonymized row for an account', async () => {
    const deleted = { id: 'd1', status: 'DELETED' };
    const { account, guest } = await findUsersByEmail(clientReturning([deleted, GUEST]), 'a@b.co');
    expect(account).toBeNull();
    expect(guest).toBe(GUEST);
  });

  it('reports nothing for an address we have never seen', async () => {
    const { account, guest } = await findUsersByEmail(clientReturning([]), 'a@b.co');
    expect(account).toBeNull();
    expect(guest).toBeNull();
  });

  it('escapes LIKE metacharacters in the address it looks up', async () => {
    let sent;
    const client = { request: async (_q, vars) => ((sent = vars), { User: [] }) };
    await findUsersByEmail(client, 'first_last@example.com');
    expect(sent.email).toBe('first\\_last@example.com');
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
