import { buildCourseCalendar } from '../courseCalendar.js';

const NOW = new Date('2026-11-09T10:00:00Z');

const course = (sessions) => ({ id: 12, title: 'Machine Learning', Sessions: sessions });

describe('buildCourseCalendar', () => {
  const saved = process.env.FRONTEND_URL;
  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://edu.opencampus.sh';
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = saved;
  });

  it('returns null when no session has a start and an end', () => {
    expect(buildCourseCalendar(course([]))).toBeNull();
    expect(buildCourseCalendar(course([{ id: 1, startDateTime: '2026-12-01T17:00:00Z', endDateTime: null }]))).toBeNull();
  });

  it('writes one event per session in UTC, with stable UIDs and CRLF line ends', () => {
    const ics = buildCourseCalendar(
      course([
        {
          id: 1, title: 'Kickoff', startDateTime: '2026-12-01T18:00:00+01:00', endDateTime: '2026-12-01T20:00:00+01:00',
          SessionAddresses: [{ address: null, LocationAddress: { shortLabel: 'Kiel', address: 'Wissenschaftspark' } }],
        },
        {
          id: 2, title: 'Machine Learning', startDateTime: '2026-12-08T17:00:00Z', endDateTime: '2026-12-08T19:00:00Z',
          SessionAddresses: [],
        },
      ]),
      { now: NOW }
    );

    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('METHOD:PUBLISH');
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2);
    expect(lines).toContain('UID:session-1@edu.opencampus.sh');
    expect(lines).toContain('DTSTAMP:20261109T100000Z');
    expect(lines).toContain('DTSTART:20261201T170000Z');
    expect(lines).toContain('DTEND:20261201T190000Z');
    expect(lines).toContain('SUMMARY:Machine Learning: Kickoff');
    expect(lines).toContain('LOCATION:Kiel (Wissenschaftspark)');
    expect(lines).toContain('URL:https://edu.opencampus.sh/course/12');
    // A session named like the course is not repeated in its summary, and an
    // unknown location is left out rather than written empty.
    expect(lines).toContain('SUMMARY:Machine Learning');
    expect(lines.filter((l) => l.startsWith('LOCATION:'))).toHaveLength(1);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('escapes text and folds long lines without splitting characters', () => {
    const title = 'Grüße, Übungen; und\nmehr ' + 'ä'.repeat(60);
    const ics = buildCourseCalendar(
      { id: 3, title, Sessions: [{ id: 9, startDateTime: '2026-12-01T17:00:00Z', endDateTime: '2026-12-01T19:00:00Z' }] },
      { now: NOW }
    );
    for (const line of ics.split('\r\n')) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`SUMMARY:Grüße\\, Übungen\\; und\\nmehr ${'ä'.repeat(60)}`);
  });
});
