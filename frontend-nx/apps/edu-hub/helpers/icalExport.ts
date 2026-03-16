interface ICalEvent {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  uid: string;
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatICalDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
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
    lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString())}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
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
