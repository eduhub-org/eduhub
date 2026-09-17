import { generateICalString } from './icalExport';

const event = (overrides: Record<string, any> = {}) => ({
  uid: 'session-1@eduhub',
  title: 'Prototyping Week – Kickoff',
  startDateTime: '2025-09-12T08:00:00Z',
  endDateTime: '2025-09-12T10:00:00Z',
  ...overrides,
});

const lines = (ical: string) => ical.split('\r\n');

describe('generateICalString', () => {
  it('wraps the events in a calendar with UTC timestamps', () => {
    const result = lines(generateICalString([event()], 'Prototyping Week'));

    expect(result[0]).toBe('BEGIN:VCALENDAR');
    expect(result).toContain('DTSTART:20250912T080000Z');
    expect(result).toContain('DTEND:20250912T100000Z');
    expect(result).toContain('UID:session-1@eduhub');
    expect(result[result.length - 1]).toBe('END:VCALENDAR');
  });

  it('emits URL only when one is given', () => {
    const withUrl = generateICalString([event({ url: 'https://edu.example/course/42' })], 'C');
    expect(lines(withUrl)).toContain('URL:https://edu.example/course/42');
    expect(generateICalString([event()], 'C')).not.toContain('URL:');
  });

  it('escapes commas, semicolons and newlines in text', () => {
    const result = generateICalString([event({ title: 'A, B; C\nD' })], 'C');
    const summary = lines(result).find((line) => line.startsWith('SUMMARY:'));
    // String.raw keeps the backslashes literal, as iCal requires them.
    expect(summary).toBe(String.raw`SUMMARY:A\, B\; C\nD`);
  });

  it('folds every content line to at most 75 octets', () => {
    const longDescription = 'Ü'.repeat(400); // 2 octets each, so folding must not split a character
    const result = generateICalString([event({ description: longDescription })], 'C');

    for (const line of lines(result)) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
    // Continuation lines start with a single space, and unfolding restores the text.
    const unfolded = result.replace(/\r\n /g, '');
    expect(unfolded).toContain(`DESCRIPTION:${longDescription}`);
  });

  it('leaves short lines unfolded', () => {
    const result = generateICalString([event({ description: 'Kurz' })], 'C');
    expect(lines(result)).toContain('DESCRIPTION:Kurz');
  });
});
