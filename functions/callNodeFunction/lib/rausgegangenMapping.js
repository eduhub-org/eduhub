import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Maps an EduHub event (a Course in an EVENTS program) to Rausgegangen API
 * payloads. Pure functions, no I/O - see syncRausgegangenEvent for the flow.
 *
 * An event is sent as exactly ONE show, never one per session: Rausgegangen has
 * no per-show registration (a show only links to a ticket URL), while our
 * registration is for the whole event. Several shows would list every session
 * as a separate date and suggest you could attend just that one. The show is
 * the first in-person session; every session is listed in the description.
 */

/** Tags Rausgegangen allows in organizer_description / content. */
const ALLOWED_TAGS = ['p', 'h3', 'h4', 'h5', 'strong', 'u', 'i', 's', 'a', 'ul', 'ol', 'li', 'sup', 'sub'];
const MAX_TAGS = 12;
const ACTIVE_ENROLLMENT_STATUSES = ['CONFIRMED', 'INVITED', 'REGISTERED'];
const TIME_ZONE = 'Europe/Berlin';

export { ACTIVE_ENROLLMENT_STATUSES };

/** AKTIV_UND_KREATIV -> "aktiv-und-kreativ", BAR -> "bar" (our enums are GraphQL-safe ALL_CAPS). */
export const toApiSlug = (enumValue) => (enumValue ? String(enumValue).toLowerCase().replace(/_/g, '-') : null);

const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Markdown (our description fields) to the HTML subset Rausgegangen accepts.
 * Larger headings become h3; images, tables and code lose their markup.
 */
export const markdownToAllowedHtml = (markdown) => {
  const source = trimmed(markdown);
  if (!source) return '';
  const html = marked.parse(source, { async: false, gfm: true, breaks: true });
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      h1: 'h3',
      h2: 'h3',
      h6: 'h5',
      em: 'i',
      b: 'strong',
      del: 's',
      strike: 's',
    },
    // "<br>" is not allowed and dropped; marked keeps a newline after it, so the
    // words on both sides stay apart.
  })
    .replace(/\n{2,}/g, '\n')
    .trim();
};

/** An absolute URL for a stored file: bucket paths are resolved against the public bucket URL. */
export const publicFileUrl = (path, bucketUrl) => {
  const value = trimmed(path);
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!bucketUrl) return null;
  return `${bucketUrl.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`;
};

/** Rausgegangen downloads pictures itself, so a localhost URL (local dev) would only fail the request. */
export const isReachableUrl = (url) => {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) && !hostname.endsWith('.local');
  } catch {
    return false;
  }
};

/**
 * Where a session of a course takes place: one entry per course location the
 * session has an address for, in course order. The LocationAddress comes from the
 * session's own pick, falling back to the course location's default (the same
 * rule as helpers/sessionLocationResolution.ts in the frontend).
 */
export const resolveSessionVenues = (session, courseLocations) =>
  (courseLocations ?? []).flatMap((courseLocation) => {
    const sessionAddress = (session.SessionAddresses ?? []).find(
      (sa) => sa.CourseLocation?.id === courseLocation.id
    );
    if (!sessionAddress) return [];
    const locationAddress =
      (sessionAddress.locationAddressId && sessionAddress.LocationAddress) ||
      courseLocation.DefaultSessionAddress ||
      null;
    return [
      {
        locationOption: courseLocation.locationOption,
        locationAddress,
        freeText: trimmed(sessionAddress.address) || trimmed(courseLocation.defaultSessionAddress),
      },
    ];
  });

const isInPerson = (venue) => venue.locationOption && venue.locationOption !== 'ONLINE';

/**
 * The session the show is built from: the first session (by start time) with an
 * in-person venue backed by a LocationAddress.
 * @returns {{ session, locationAddress } | { error: string }}
 */
export const pickShowSession = (sessions, courseLocations) => {
  const ordered = [...(sessions ?? [])].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );
  let inPersonWithoutAddress = false;
  for (const session of ordered) {
    const venues = resolveSessionVenues(session, courseLocations).filter(isInPerson);
    const withAddress = venues.find((venue) => venue.locationAddress);
    if (withAddress) return { session, locationAddress: withAddress.locationAddress };
    if (venues.length > 0) inPersonWithoutAddress = true;
  }
  return {
    error: inPersonWithoutAddress
      ? 'Die Präsenz-Termine haben keine hinterlegte Adresse (Ort aus der Adressverwaltung wählen).'
      : 'Die Veranstaltung hat keine Präsenz-Termine.',
  };
};

const formatDate = (iso) =>
  new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));

const formatTime = (iso) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

/** "Di., 03.11.2026, 18:00–20:00 Uhr" */
export const formatSessionTime = (session) => {
  const start = session.startDateTime;
  const end = session.endDateTime;
  const sameDay = end && formatDate(start) === formatDate(end);
  if (!end) return `${formatDate(start)}, ${formatTime(start)} Uhr`;
  if (sameDay) return `${formatDate(start)}, ${formatTime(start)}–${formatTime(end)} Uhr`;
  return `${formatDate(start)}, ${formatTime(start)} Uhr – ${formatDate(end)}, ${formatTime(end)} Uhr`;
};

const venueLabel = (venue) => {
  if (!isInPerson(venue)) return 'online';
  const address = venue.locationAddress;
  if (address) {
    const label = trimmed(address.shortLabel);
    const street = trimmed(address.street) || trimmed(address.address);
    return label && street && label !== street ? `${label}, ${street}` : label || street;
  }
  return venue.freeText;
};

/** The "Termine" list of a multi-session event. */
const buildSessionListHtml = (sessions, courseLocations) => {
  const ordered = [...sessions].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
  );
  const items = ordered.map((session) => {
    const places = [...new Set(resolveSessionVenues(session, courseLocations).map(venueLabel).filter(Boolean))];
    const parts = [`<strong>${escapeHtml(formatSessionTime(session))}</strong>`];
    if (trimmed(session.title)) parts.push(escapeHtml(trimmed(session.title)));
    if (places.length) parts.push(escapeHtml(places.join(' / ')));
    return `<li>${parts.join(' – ')}</li>`;
  });
  return `<h3>Termine</h3><ul>${items.join('')}</ul><p>Die Anmeldung gilt für alle Termine.</p>`;
};

/**
 * organizer_description: tagline, both description sections, the list of
 * sessions (more than one), the organizer and the registration link.
 */
export const buildEventDescription = ({ course, organizationName, registrationUrl }) => {
  const blocks = [];
  if (trimmed(course.tagline)) blocks.push(`<p><strong>${escapeHtml(trimmed(course.tagline))}</strong></p>`);

  for (const [heading, content] of [
    [course.headingDescriptionField1, course.contentDescriptionField1],
    [course.headingDescriptionField2, course.contentDescriptionField2],
  ]) {
    if (!trimmed(content)) continue;
    if (trimmed(heading)) blocks.push(`<h3>${escapeHtml(trimmed(heading))}</h3>`);
    blocks.push(markdownToAllowedHtml(content));
  }

  const sessions = course.Sessions ?? [];
  if (sessions.length > 1) blocks.push(buildSessionListHtml(sessions, course.CourseLocations));

  if (trimmed(organizationName)) {
    blocks.push(`<p>Veranstaltet von <strong>${escapeHtml(trimmed(organizationName))}</strong>.</p>`);
  }
  if (registrationUrl) {
    blocks.push(`<p><a href="${escapeHtml(registrationUrl)}">Zur Anmeldung</a></p>`);
  }
  return blocks.join('\n');
};

/** Lowercase, unique, non-empty, at most 12. */
export const normalizeTags = (tags) =>
  [...new Set((Array.isArray(tags) ? tags : []).map((tag) => trimmed(String(tag ?? '')).toLowerCase()).filter(Boolean))].slice(
    0,
    MAX_TAGS
  );

/** "12.50", "0.00" when free; null when only a free-text price is known. */
export const formatPrice = (course) => {
  if (course.basePrice !== null && course.basePrice !== undefined && course.basePrice !== '') {
    const value = Number(course.basePrice);
    if (Number.isFinite(value) && value >= 0) return value.toFixed(2);
  }
  return trimmed(course.cost) ? null : '0.00';
};

/**
 * Where people register. Our course page only while it is public; otherwise the
 * external registration link, or nothing.
 */
export const registrationUrlOf = (course, frontendUrl) => {
  const external = trimmed(course.externalRegistrationLink);
  if (external) return external;
  if (course.published && course.Program?.published && frontendUrl) {
    return `${frontendUrl.replace(/\/+$/, '')}/course/${course.id}`;
  }
  return null;
};

export const isSoldOut = (course, activeEnrollmentCount) =>
  Number(course.maxParticipants) > 0 && Number(activeEnrollmentCount) >= Number(course.maxParticipants);

export const buildEventPayload = ({ course, listing, mappingId, published, bucketUrl, frontendUrl }) => {
  const picture = publicFileUrl(course.coverImage, bucketUrl);
  const registrationUrl = registrationUrlOf(course, frontendUrl);
  return {
    mapping_id: mappingId,
    title: trimmed(course.title),
    picture: isReachableUrl(picture) ? picture : null,
    picture_credits: trimmed(course.coverImageCredits).slice(0, 120),
    category: toApiSlug(listing.category) || 'gesprochenes',
    tags: normalizeTags(listing.tags),
    organizer_description: buildEventDescription({
      course,
      organizationName: course.Program?.Organization?.name,
      registrationUrl,
    }),
    price: formatPrice(course),
    price_description: trimmed(course.cost),
    published: Boolean(published),
  };
};

export const buildShowPayload = ({ course, session, mappingId, eventId, locationId, soldOut, frontendUrl, sessionCount }) => {
  const payload = {
    mapping_id: mappingId,
    event: eventId,
    start_date: new Date(session.startDateTime).toISOString(),
    location: locationId,
    ticket_url: registrationUrlOf(course, frontendUrl) || '',
    state: soldOut ? 'sold_out' : 'takes_place',
  };
  // A multi-session event gets no end date: first-to-last would read as one
  // continuous multi-day event.
  if (sessionCount === 1 && session.endDateTime) {
    payload.end_date = new Date(session.endDateTime).toISOString();
  }
  return payload;
};

/** The fields a location needs before we can create it on Rausgegangen (German labels for the status). */
export const missingLocationFields = (locationAddress) => {
  const missing = [];
  if (!trimmed(locationAddress.street)) missing.push('Straße');
  if (!trimmed(locationAddress.zipCode)) missing.push('PLZ');
  if (!trimmed(locationAddress.city)) missing.push('Stadt');
  if (locationAddress.latitude === null || locationAddress.latitude === undefined) missing.push('Breitengrad');
  if (locationAddress.longitude === null || locationAddress.longitude === undefined) missing.push('Längengrad');
  return missing;
};

export const buildLocationPayload = ({ locationAddress, mappingId, bucketUrl }) => {
  const picture = publicFileUrl(locationAddress.image, bucketUrl);
  const description = trimmed(locationAddress.description);
  return {
    mapping_id: mappingId,
    title: trimmed(locationAddress.shortLabel) || trimmed(locationAddress.street),
    category: toApiSlug(locationAddress.category) || 'misc',
    content: description ? `<p>${escapeHtml(description)}</p>` : '',
    picture: isReachableUrl(picture) ? picture : null,
    picture_credits: trimmed(locationAddress.imageCredits).slice(0, 120),
    address_street: trimmed(locationAddress.street),
    address_zipcode: trimmed(locationAddress.zipCode),
    address_city: trimmed(locationAddress.city),
    address_country: trimmed(locationAddress.country) || 'Deutschland',
    address_additional_infos: trimmed(locationAddress.addressAdditionalInfo) || null,
    directions: trimmed(locationAddress.directions) || null,
    lat: Number(locationAddress.latitude),
    lng: Number(locationAddress.longitude),
    website_url: trimmed(locationAddress.websiteUrl) || null,
    public_email: trimmed(locationAddress.publicEmail) || null,
    public_phone: trimmed(locationAddress.publicPhone) || null,
    instagram_url: trimmed(locationAddress.instagramUrl) || null,
    published: true,
  };
};

const normalizeStreet = (value) =>
  trimmed(value)
    .toLowerCase()
    .replace(/straße|strasse/g, 'str')
    .replace(/[^a-z0-9äöü]/g, '');

/**
 * The single search result that is clearly the same venue: same street and zip
 * code. Anything ambiguous returns null, so we create our own location instead
 * of guessing (an admin can still link one by hand).
 */
export const findMatchingLocation = (results, locationAddress) => {
  const street = normalizeStreet(locationAddress.street);
  const zip = trimmed(locationAddress.zipCode);
  if (!street || !zip) return null;
  const matches = (results ?? []).filter(
    (result) => normalizeStreet(result.address_street) === street && trimmed(result.address_zipcode) === zip
  );
  return matches.length === 1 ? matches[0] : null;
};
