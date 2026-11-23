import { describe, expect, it } from '@jest/globals';
import { readReportIds, selectSpamAccounts, spamNameReason } from '../scripts/disable-spam-accounts.js';

const user = (id, firstName, lastName, extra = {}) => ({ id, firstName, lastName, enabled: true, email: `${id}@example.org`, ...extra });

describe('spamNameReason', () => {
  it('flags URLs, spam keywords and over-long names', () => {
    expect(spamNameReason('Free Dating', 'https://f3gxp.page.link')).toBe('name-url');
    expect(spamNameReason('boris', 'www.yandex.ru')).toBe('name-url');
    expect(spamNameReason('nude', 'nude')).toBe('name-keyword');
    expect(spamNameReason('edu.opencampus.sh', 'x'.repeat(60))).toBe('name-long');
    expect(spamNameReason('Gleb#Stoun[Upecikjeuzqhihiv,2,5]', 'Gleb#Stoun[Upecikjeuzqhihiv,2,5]')).toBe('name-long');
  });

  it('leaves ordinary names alone', () => {
    expect(spamNameReason('Lena', 'Ziegler')).toBeNull();
    expect(spamNameReason('Anna Magdalena', 'Bössen')).toBeNull();
    expect(spamNameReason('Essex', 'Sexton')).toBeNull();
    expect(spamNameReason(null, undefined)).toBeNull();
  });
});

describe('selectSpamAccounts', () => {
  const eduhubIds = new Set(['spam-in-eduhub', 'real-in-eduhub', 'spammy-name-in-eduhub', '1cbe7e19-057c-45c7-95ac-0d94f21cf0d7']);
  const spamIds = new Set(['spam-in-eduhub', '1cbe7e19-057c-45c7-95ac-0d94f21cf0d7']);

  it('selects EduHub SPAM and spam-named Keycloak-only users', () => {
    const selected = selectSpamAccounts(
      [
        user('spam-in-eduhub', 'Normal', 'Name'),
        user('real-in-eduhub', 'Lena', 'Ziegler'),
        user('spammy-name-in-eduhub', 'Visit', 'https://x.ru'),
        user('keycloak-only-spam', 'Hot', 'singles near you'),
        user('keycloak-only-real', 'Susana', 'Murillo'),
      ],
      eduhubIds,
      spamIds
    );
    expect(selected.map(({ user: u, reason }) => [u.id, reason])).toEqual([
      ['spam-in-eduhub', 'eduhub-spam'],
      ['keycloak-only-spam', 'name-keyword'],
    ]);
  });

  it('skips protected, already disabled and whitelisted accounts', () => {
    const selected = selectSpamAccounts(
      [
        user('1cbe7e19-057c-45c7-95ac-0d94f21cf0d7', 'N.', 'N.'),
        user('spam-in-eduhub', 'x', 'y', { enabled: false }),
        user('villa', 'Die Villa - Psychosoziale Kinder- und Jugendhilfeeinrichtung', 'GmbH', {
          email: 'Bewerbung@DieVilla.online',
        }),
      ],
      eduhubIds,
      spamIds
    );
    expect(selected).toEqual([]);
  });
});

describe('readReportIds', () => {
  it('reads the id column and skips header and blank lines', () => {
    expect(readReportIds('id\temail\treason\tname\na\ta@x\teduhub-spam\tA\nb\t\tname-url\tB\n\n')).toEqual(['a', 'b']);
  });
});
