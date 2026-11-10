import { resolveSessionLocations } from '../sendSessionReminders/index.js';

const CRLF = '\r\n';

/** Escapes a TEXT value (RFC 5545 §3.3.11). */
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds a content line to at most 75 octets (RFC 5545 §3.1), never splitting
 * a multi-byte character: course titles and venues carry umlauts.
 */
function foldLine(line) {
  const parts = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char, 'utf8');
    // Continuation lines start with a space, which counts towards their 75.
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

/** "20261027T150000Z": UTC, so no VTIMEZONE block is needed. */
function formatUtc(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * The course's sessions as an iCalendar file, one event per session, or null
 * when no session has a start and an end yet (an empty calendar is no use).
 *
 * METHOD:PUBLISH rather than REQUEST: this is a schedule to import, not a
 * meeting invitation the participant's client would offer to accept or decline
 * and reply to the sender.
 *
 * Each event's UID is stable per session, so importing the file from a later
 * mail updates the events instead of duplicating them.
 *
 * @param {Object} course - { id, title, Sessions: [{ id, title, startDateTime, endDateTime, SessionAddresses }] }
 * @param {Object} [options]
 * @param {Date} [options.now] - DTSTAMP, injectable for tests
 * @returns {string|null}
 */
export function buildCourseCalendar(course, { now = new Date() } = {}) {
  const sessions = (course?.Sessions ?? []).filter((s) => s.startDateTime && s.endDateTime);
  if (sessions.length === 0) return null;

  const frontendUrl = process.env.FRONTEND_URL || 'https://edu.opencampus.sh';
  const courseLink = `${frontendUrl}/course/${course.id}`;
  const uidDomain = new URL(frontendUrl).hostname;
  const stamp = formatUtc(now);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//opencampus.sh//EduHub//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(course.title)}`,
  ];

  for (const session of sessions) {
    const sessionTitle = session.title?.trim();
    const summary =
      sessionTitle && sessionTitle !== course.title ? `${course.title}: ${sessionTitle}` : course.title;
    const location = resolveSessionLocations(session.SessionAddresses).join(' / ');

    lines.push(
      'BEGIN:VEVENT',
      `UID:session-${session.id}@${uidDomain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${formatUtc(session.startDateTime)}`,
      `DTEND:${formatUtc(session.endDateTime)}`,
      `SUMMARY:${escapeText(summary)}`,
      ...(location ? [`LOCATION:${escapeText(location)}`] : []),
      `DESCRIPTION:${escapeText(courseLink)}`,
      `URL:${courseLink}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}
