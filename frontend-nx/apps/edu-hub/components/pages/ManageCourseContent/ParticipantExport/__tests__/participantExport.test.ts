import { AttendanceStatus_enum } from '../../../../../__generated__/globalTypes';
import {
  attendanceDayLabel,
  buildAttendanceListHtml,
  buildCsv,
  buildNameTagsHtml,
  escapeHtml,
  dayKeyFromHeader,
  exportFileName,
  parseAttendanceCell,
  parseAttendanceCsv,
  parseCsv,
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

describe('attendance CSV', () => {
  const { ATTENDED, MISSED } = AttendanceStatus_enum;

  it('labels day columns per locale and reads both formats back', () => {
    const day = new Date('2026-10-14T21:30:00Z');
    expect(attendanceDayLabel(day, 'Europe/Berlin', 'de')).toBe('14.10.2026');
    expect(attendanceDayLabel(day, 'Europe/Berlin', 'en')).toBe('2026-10-14');
    expect(dayKeyFromHeader('Anwesend 14.10.2026')).toBe('2026-10-14');
    expect(dayKeyFromHeader('Present 2026-10-14')).toBe('2026-10-14');
    expect(dayKeyFromHeader('Anwesend 4.1.2026')).toBe('2026-01-04');
    expect(dayKeyFromHeader('Status')).toBeNull();
  });

  it('round-trips what buildCsv writes', () => {
    const rows = [
      ['Name', 'E-Mail', 'Anwesend 14.10.2026'],
      ['Müller; Söhne', 'say "hi"', 'x'],
      ['=HYPERLINK("x")', 'two\nlines', ''],
    ];
    expect(parseCsv(buildCsv(rows, ';'))).toEqual(rows);
    expect(parseCsv(buildCsv(rows, ','))).toEqual(rows);
  });

  it('accepts files saved without BOM, with LF and trailing empty lines', () => {
    expect(parseCsv('a,b\nc,d\n\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('reads lenient cell values, empty meaning missed', () => {
    for (const value of ['x', 'X', ' ja ', 'yes', '1', 'true', '✓', 'anwesend']) {
      expect(parseAttendanceCell(value)).toBe(ATTENDED);
    }
    for (const value of ['', '  ', 'nein', 'no', '0', 'false', '-']) {
      expect(parseAttendanceCell(value)).toBe(MISSED);
    }
    expect(parseAttendanceCell('maybe')).toBeNull();
  });

  it('reads the email and day columns of an export', () => {
    const parsed = parseAttendanceCsv(
      parseCsv(
        '\uFEFFNachname;Vorname;E-Mail;Status;Anwesend 14.10.2026;Anwesend 15.10.2026\r\n' +
          'Lovelace;Ada;ADA@example.com ;bestätigt;x;\r\n' +
          'Hopper;Grace;grace@example.com;bestätigt;vielleicht;ja\r\n' +
          ';;;;;\r\n'
      )
    );
    expect(parsed.hasEmailColumn).toBe(true);
    expect(parsed.dayColumns.map((column) => column.dayKey)).toEqual(['2026-10-14', '2026-10-15']);
    expect(parsed.rows).toEqual([
      { line: 2, email: 'ada@example.com', statusByDay: { '2026-10-14': ATTENDED, '2026-10-15': MISSED } },
      { line: 3, email: 'grace@example.com', statusByDay: { '2026-10-15': ATTENDED } },
    ]);
    expect(parsed.invalidCells).toEqual([{ line: 3, header: 'Anwesend 14.10.2026', value: 'vielleicht' }]);
  });

  it('reports a file without an email column', () => {
    expect(parseAttendanceCsv(parseCsv('Name,Present 2026-10-14\nAda,x\n')).hasEmailColumn).toBe(false);
  });
});
