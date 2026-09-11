interface ICalEvent {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  /** Absolute link back to the page the entry came from. */
  url?: string;
  uid: string;
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatICalDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** UTF-8 size of a single code point, which is how RFC 5545 counts. */
function utf8Size(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * RFC 5545 caps a content line at 75 octets and continues it with CRLF + a
 * single space. Session descriptions run to 500 characters, which would
 * otherwise emit one very long line that stricter calendar clients reject.
 *
 * Walks code points rather than bytes so a multi-byte character is never split,
 * and so it needs no TextEncoder (absent from jsdom, and from older runtimes).
 */
function foldICalLine(line: string): string {
  const chunks: string[] = [];
  let current = '';
  // The first line holds 75 octets; continuation lines hold 74, because the
  // leading space counts towards the limit.
  let used = 0;
  let limit = 75;

  for (const character of line) {
    const size = utf8Size(character.codePointAt(0) as number);
    if (used + size > limit) {
      chunks.push(current);
      current = '';
      used = 0;
      limit = 74;
    }
    current += character;
    used += size;
  }
  chunks.push(current);

  return chunks.join('\r\n ');
}

export function generateICalString(events: ICalEvent[], calendarName: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduHub//Calendar//EN',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART:${formatICalDate(event.startDateTime)}`);
    lines.push(`DTEND:${formatICalDate(event.endDateTime)}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }
    lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString())}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldICalLine).join('\r\n');
}

export function downloadICalFile(icalString: string, filename = 'eduhub-calendar.ics') {
  const blob = new Blob([icalString], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
