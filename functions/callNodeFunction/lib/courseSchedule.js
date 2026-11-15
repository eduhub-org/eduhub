/**
 * When and where a Course takes place, for the enrollment mails
 * ([Course:DateTime], [Course:LocationList] and their [#if:...] flags).
 *
 * Kept free of imports from the reminder and session-change modules: those
 * import emailTemplateVariables.js, which imports this file.
 */

const TIME_ZONE = 'Europe/Berlin';

// Placeholder the migration gave LocationAddress rows it could not match; not
// worth showing to a participant (same rule as the frontend's meaningfulLabel).
const PLACEHOLDER_LABEL = 'generic address';

// Numeric and 24h because one template carries German and English, and this
// reads right in both (same form as [Session:DateTimeRange]).
const dateFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('de-DE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const formatDate = (value) => dateFormat.format(new Date(value));
const formatDateTime = (value) => `${formatDate(value)}, ${timeFormat.format(new Date(value))}`;

const isValidDate = (value) => value != null && !Number.isNaN(new Date(value).getTime());

/**
 * One Session: "26.11.2026, 18:00–20:00", or both full timestamps when it ends
 * on another day. Several: "14.01.2027 – 25.03.2027" from the First Session to
 * the last one, or the single day with first start and last end when they all
 * fall on one day. No Sessions: the Course's start date. Otherwise ''.
 */
export function formatCourseDateTime(course) {
  const sessions = (course?.Sessions ?? [])
    .filter((s) => isValidDate(s.startDateTime))
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  if (sessions.length === 0) {
    return isValidDate(course?.startTime) ? formatDate(course.startTime) : '';
  }

  const first = sessions[0];
  const ends = sessions.map((s) => (isValidDate(s.endDateTime) ? s.endDateTime : s.startDateTime));
  const lastEnd = ends.reduce((a, b) => (new Date(b) > new Date(a) ? b : a));
  const start = first.startDateTime;

  if (formatDate(start) === formatDate(lastEnd)) {
    const hasEnd = sessions.some((s) => isValidDate(s.endDateTime));
    return hasEnd ? `${formatDateTime(start)}–${timeFormat.format(new Date(lastEnd))}` : formatDateTime(start);
  }
  return sessions.length === 1 ? `${formatDateTime(start)} – ${formatDateTime(lastEnd)}` : `${formatDate(start)} – ${formatDate(lastEnd)}`;
}

const optionLabel = (option) => (option ? option.charAt(0) + option.slice(1).toLowerCase() : '');

const venueText = (venue) => {
  const address = venue?.address?.trim() || '';
  const label = venue?.shortLabel?.trim();
  if (!label || label.toLowerCase() === PLACEHOLDER_LABEL || label === address) return address;
  return address ? `${label} (${address})` : label;
};

/**
 * "Kiel – ZBW (Düsternbrooker Weg 120, 24105 Kiel)", or just "Online": the
 * meeting link is never shown, it goes out with the Session Reminder and is on
 * the course page.
 */
const describePlace = (sessionAddress) => {
  const option = sessionAddress.CourseLocation?.locationOption;
  if (option === 'ONLINE') return 'Online';
  const place = venueText(sessionAddress.LocationAddress) || sessionAddress.address?.trim() || '';
  const label = optionLabel(option);
  if (label && place) return `${label} – ${place}`;
  return label || place;
};

/**
 * Every distinct Session Location across the Course's Sessions, in the order
 * they first occur, plus whether any of them is online.
 */
export function describeCourseLocations(course) {
  const sessions = [...(course?.Sessions ?? [])].sort(
    (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  );
  const addresses = sessions.flatMap((s) => s.SessionAddresses ?? []);
  const places = [...new Set(addresses.map(describePlace).filter(Boolean))];
  const online = addresses.some((sa) => sa.CourseLocation?.locationOption === 'ONLINE');
  return { places, online };
}

/** Everything the enrollment mails need about when and where. */
export function describeCourseSchedule(course) {
  const { places, online } = describeCourseLocations(course);
  return { dateTime: formatCourseDateTime(course), locationList: places, online };
}
