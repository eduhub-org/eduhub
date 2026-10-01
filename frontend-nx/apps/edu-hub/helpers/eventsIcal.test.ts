import { buildEventsIcal, feedLocation, htmlToPlainText, IcalFeedEvent, IcalFeedSession } from './eventsIcal';
import { generateICalString } from './icalExport';

jest.mock('./filehandling', () => ({
  getPublicImageUrl: (filePath: string | null) => (filePath ? `https://cdn.example/${filePath}` : null),
}));

const NOW = new Date('2026-09-28T10:00:00Z');

const KIEL = { id: 10, locationOption: 'KIEL', defaultSessionAddress: 'Wissenschaftspark', defaultSessionAddressId: null };
const ONLINE = { id: 11, locationOption: 'ONLINE', defaultSessionAddress: '', defaultSessionAddressId: null };

const session = (id: number, start: string, end: string | null, overrides: Partial<IcalFeedSession> = {}): IcalFeedSession => ({
  id,
  title: `Session ${id}`,
  startDateTime: start,
  endDateTime: end,
  programId: null,
  SessionAddresses: [{ id: id * 100, address: '', locationAddressId: null, CourseLocation: KIEL }],
  ...overrides,
});

const event = (id: number, sessions: IcalFeedSession[], overrides: Partial<IcalFeedEvent> = {}): IcalFeedEvent => ({
  id,
  title: `Event ${id}`,
  tagline: null,
  created_at: '2026-08-01T12:00:00Z',
  CourseLocations: [KIEL],
  Sessions: sessions,
  ...overrides,
});

const OPTIONS = {
  calendarName: 'EduHub Events',
  baseUrl: 'https://edu.example',
  addressMap: new Map<number, { address: string }>(),
  renderPlainText: (markdown: string) => markdown,
  now: NOW,
};

/** The calendar with folded lines joined back up, split into lines. */
const lines = (ics: string) => ics.replace(/\r\n /g, '').split('\r\n');
const vevents = (ics: string) => ics.split('BEGIN:VEVENT').slice(1);

describe('buildEventsIcal', () => {
  it('writes one entry per upcoming session and skips sessions that have ended', () => {
    const ics = buildEventsIcal(
      [
        event(1, [
          session(1, '2026-09-27T08:00:00Z', '2026-09-27T10:00:00Z'),
          session(2, '2026-09-28T08:00:00Z', '2026-09-28T09:00:00Z'),
          session(3, '2026-09-28T09:00:00Z', '2026-09-28T12:00:00Z'),
          session(4, '2026-10-02T08:00:00Z', null),
        ]),
        event(2, [session(5, '2026-09-01T08:00:00Z', '2026-09-01T10:00:00Z')]),
      ],
      OPTIONS
    );

    const result = lines(ics);
    expect(vevents(ics)).toHaveLength(2);
    expect(result).toContain('UID:session-3@eduhub');
    expect(result).toContain('UID:session-4@eduhub');
    // A session without an end is written as starting and ending at the same time.
    expect(result).toContain('DTSTART:20261002T080000Z');
    expect(result).toContain('DTEND:20261002T080000Z');
    expect(result).toContain('SUMMARY:Event 1 – Session 3');
    expect(result).toContain('URL:https://edu.example/course/1');
    expect(result).toContain('X-WR-TIMEZONE:Europe/Berlin');
    expect(result).toContain('DTSTAMP:20260928T100000Z');
  });

  it('orders the entries by start across events', () => {
    const ics = buildEventsIcal(
      [
        event(1, [session(1, '2026-10-05T08:00:00Z', '2026-10-05T10:00:00Z')]),
        event(2, [session(2, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z')]),
      ],
      OPTIONS
    );
    expect(lines(ics).filter((line) => line.startsWith('UID:'))).toEqual(['UID:session-2@eduhub', 'UID:session-1@eduhub']);
  });

  it('uses the event title alone for a single session', () => {
    const ics = buildEventsIcal([event(1, [session(1, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z')])], OPTIONS);
    expect(lines(ics)).toContain('SUMMARY:Event 1');
  });

  it('describes the event with its tagline, description fields and link', () => {
    const ics = buildEventsIcal(
      [
        event(1, [session(1, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z')], {
          tagline: 'Talks, workshops',
          headingDescriptionField1: 'Worum geht es?',
          contentDescriptionField1: 'Alles über KI',
          headingDescriptionField2: 'Nur eine Überschrift',
          contentDescriptionField2: null,
        }),
      ],
      OPTIONS
    );
    expect(lines(ics)).toContain(
      'DESCRIPTION:Talks\\, workshops\\n\\nWorum geht es?\\nAlles über KI\\n\\nhttps://edu.example/course/1'
    );
  });

  it('adds the cover image, categories and last change', () => {
    const ics = buildEventsIcal(
      [
        event(1, [session(1, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z')], {
          coverImage: 'public/cover.jpg',
          updated_at: '2026-09-20T07:00:00Z',
        }),
      ],
      { ...OPTIONS, categories: ['Bildung'] }
    );
    const result = lines(ics);
    expect(result).toContain('ATTACH;FMTTYPE=image/jpeg:https://cdn.example/public/cover.jpg');
    expect(result).toContain('CATEGORIES:Bildung');
    expect(result).toContain('LAST-MODIFIED:20260920T070000Z');
  });

  it('resolves the address through the LocationAddress map and never leaks an online meeting link', () => {
    const ics = buildEventsIcal(
      [
        event(
          1,
          [
            session(1, '2026-10-01T08:00:00Z', '2026-10-01T10:00:00Z', {
              SessionAddresses: [
                { id: 1, address: '', locationAddressId: 7, CourseLocation: KIEL },
                { id: 2, address: 'https://zoom.us/j/123', locationAddressId: null, CourseLocation: ONLINE },
              ],
            }),
          ],
          { CourseLocations: [KIEL, ONLINE] }
        ),
      ],
      { ...OPTIONS, addressMap: new Map([[7, { address: 'Christian-Albrechts-Platz 4, 24118 Kiel' }]]) }
    );
    expect(lines(ics)).toContain('LOCATION:Christian-Albrechts-Platz 4\\, 24118 Kiel – Online');
    expect(ics).not.toContain('zoom');
  });
});

describe('feedLocation', () => {
  const location = (locationOption: string | null, displayAddress: string) => ({ key: 'k', locationOption, displayAddress });

  it('appends the city when the address does not name it', () => {
    expect(feedLocation([location('KIEL', 'Raum 2.12')])).toBe('Raum 2.12, Kiel');
    expect(feedLocation([location('KIEL', 'Werftbahnstraße 8, Kiel')])).toBe('Werftbahnstraße 8, Kiel');
  });

  it('falls back to the city when there is no address or the address is a link', () => {
    expect(feedLocation([location('HEIDE', '')])).toBe('Heide');
    expect(feedLocation([location('KIEL', 'www.example.com/room')])).toBe('Kiel');
  });

  it('writes online places as just "Online" and drops duplicates and empty options', () => {
    expect(feedLocation([location('ONLINE', 'https://meet.example/abc'), location('ONLINE', 'x')])).toBe('Online');
    expect(feedLocation([location(null, 'Somewhere')])).toBeUndefined();
  });
});

describe('htmlToPlainText', () => {
  it('turns rendered Markdown into readable text', () => {
    const html =
      '<p>Hallo &amp; willkommen</p>\n<ul>\n<li>Eins</li>\n<li><strong>Zwei</strong></li>\n</ul>\n<p>Mehr auf <a href="https://example.org">der Seite</a>.</p>';
    expect(htmlToPlainText(html)).toBe('Hallo & willkommen\n\n• Eins\n• Zwei\n\nMehr auf der Seite (https://example.org).');
  });

  it('keeps the space between inline elements', () => {
    expect(htmlToPlainText('<p><strong>Neu</strong> <em>hier</em></p>')).toBe('Neu hier');
  });

  it('turns a hard line break into a single newline', () => {
    expect(htmlToPlainText('<p>Zeile mit<br/>\nUmbruch</p>')).toBe('Zeile mit\nUmbruch');
  });

  it('decodes numeric entities', () => {
    expect(htmlToPlainText('<p>&#39;Hi&#x27;</p>')).toBe("'Hi'");
  });
});

describe('generateICalString options', () => {
  it('leaves the calendar untouched when no options are given', () => {
    const ics = generateICalString(
      [{ uid: 'u', title: 'T', startDateTime: '2026-10-01T08:00:00Z', endDateTime: '2026-10-01T09:00:00Z' }],
      'C'
    );
    expect(ics).not.toContain('X-WR-TIMEZONE');
    expect(ics).not.toContain('REFRESH-INTERVAL');
    expect(ics).not.toContain('CATEGORIES');
    expect(ics).not.toContain('ATTACH');
  });

  it('writes the refresh interval for subscribers', () => {
    const ics = generateICalString([], 'C', { refreshInterval: 'PT6H' });
    expect(lines(ics)).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT6H');
    expect(lines(ics)).toContain('X-PUBLISHED-TTL:PT6H');
  });
});
