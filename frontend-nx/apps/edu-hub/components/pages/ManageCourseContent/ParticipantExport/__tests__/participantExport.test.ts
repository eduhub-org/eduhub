import {
  buildAttendanceListHtml,
  buildCsv,
  buildNameTagsHtml,
  escapeHtml,
  exportFileName,
  toExportParticipants,
} from '../participantExport';

const enrollment = (user: Record<string, unknown>, status = 'REGISTERED') => ({
  status,
  User: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', ...user },
});

describe('toExportParticipants', () => {
  it('prefers the linked organization and falls back to the free text', () => {
    const [linked, guest, none] = toExportParticipants([
      enrollment({ Organization: { name: 'opencampus.sh' }, organizationName: 'typed' }),
      enrollment({ Organization: null, organizationName: 'Uni Kiel' }),
      enrollment({}),
    ]);
    expect(linked.organization).toBe('opencampus.sh');
    expect(guest.organization).toBe('Uni Kiel');
    expect(none.organization).toBe('');
  });
});

describe('buildCsv', () => {
  it('starts with a BOM and uses CRLF line endings', () => {
    expect(buildCsv([['a', 'b'], ['c', 'd']], ',')).toBe('﻿a,b\r\nc,d\r\n');
  });

  it('quotes delimiters, quotes and line breaks', () => {
    const csv = buildCsv([['Müller; Söhne', 'say "hi"', 'two\nlines', 'a,b']], ';');
    expect(csv).toBe('﻿"Müller; Söhne";"say ""hi""";"two\nlines";a,b\r\n');
  });

  it('keeps spreadsheet formulas as text', () => {
    const csv = buildCsv([['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)', 'plain']], ',');
    expect(csv).toBe('﻿"\'=HYPERLINK(""x"")",\'+1,\'-2,\'@SUM(A1),plain\r\n');
  });
});

describe('print views', () => {
  const participants = toExportParticipants([
    enrollment({ firstName: '<script>', organizationName: 'A & B' }),
  ]);

  it('escapes every value', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');

    const list = buildAttendanceListHtml({
      courseTitle: 'Event <1>',
      subtitle: 'Monday',
      participants,
      lang: 'en',
      labels: {
        number: 'No.',
        lastName: 'Last name',
        firstName: 'First name',
        organization: 'Organization',
        present: 'Present',
        signature: 'Signature',
        count: '1 participant',
      },
    });
    const tags = buildNameTagsHtml({ courseTitle: 'Event <1>', participants, lang: 'en' });

    for (const html of [list, tags]) {
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('A &amp; B');
      expect(html).toContain('Event &lt;1&gt;');
    }
    expect(list).toContain('Monday · 1 participant');
  });

  it('omits the organization line on a name tag without one', () => {
    const tags = buildNameTagsHtml({
      courseTitle: 'Event',
      participants: toExportParticipants([enrollment({})]),
      lang: 'en',
    });
    expect(tags).not.toContain('class="org"');
  });
});

describe('exportFileName', () => {
  it('slugs the course title and appends the date', () => {
    expect(exportFileName('Künstliche Intelligenz: Grundlagen!', 'participants', 'csv', new Date('2026-09-28T10:00:00Z'))).toBe(
      'kunstliche-intelligenz-grundlagen-participants-2026-09-28.csv'
    );
    expect(exportFileName('***', 'participants', 'csv', new Date('2026-09-28T10:00:00Z'))).toBe(
      'course-participants-2026-09-28.csv'
    );
  });
});
