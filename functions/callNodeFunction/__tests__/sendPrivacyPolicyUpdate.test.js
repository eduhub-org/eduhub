import { describe, expect, it } from '@jest/globals';

const { parseVersion, pendingRecipients } = await import('../scripts/send-privacy-policy-update.js');

describe('parseVersion', () => {
  it('reads an ISO date after --version', () => {
    expect(parseVersion(['node', 'script', '--version', '2026-11-05', '--send'])).toBe('2026-11-05');
  });

  it.each([[['node', 'script']], [['node', 'script', '--version']], [['node', 'script', '--version', 'nov']]])(
    'rejects a missing or malformed version %#',
    (argv) => {
      expect(parseVersion(argv)).toBeNull();
    }
  );
});

describe('pendingRecipients', () => {
  it('skips addresses already mailed for the version, case-insensitively', () => {
    const users = [{ email: 'A@example.com' }, { email: 'b@example.com' }];
    expect(pendingRecipients(users, new Set(['a@example.com']))).toEqual([{ email: 'b@example.com' }]);
  });

  it('mails an address shared by two accounts only once and skips empty ones', () => {
    const users = [{ email: 'c@example.com' }, { email: ' C@example.com ' }, { email: '' }, { email: null }];
    expect(pendingRecipients(users, new Set())).toEqual([{ email: 'c@example.com' }]);
  });
});
