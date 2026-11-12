import { formatReminderDateTimeRange } from '../sendSessionReminders/index.js';

// Placeholder the migration gave LocationAddress rows it could not match; not
// worth showing to a participant (same rule as the frontend's meaningfulLabel).
const PLACEHOLDER_LABEL = 'generic address';

const optionLabel = (option) =>
  option === 'ONLINE' ? 'Online' : option ? option.charAt(0) + option.slice(1).toLowerCase() : '';

/** A venue as "Label (Address)", or the address alone when the label adds nothing. */
const venueText = (venue) => {
  const address = venue?.address?.trim() || '';
  const label = venue?.shortLabel?.trim();
  if (!label || label.toLowerCase() === PLACEHOLDER_LABEL || label === address) return address;
  return address ? `${label} (${address})` : label;
};

/**
 * One place for the mail: "Kiel – ZBW (Düsternbrooker Weg 120)", or just
 * "Online". The meeting link is never shown, since the mail goes to people who
 * may not be entitled to it; the course page has it.
 */
const describePlace = (courseLocation, entry, addressMap) => {
  const label = optionLabel(courseLocation.locationOption);
  if (courseLocation.locationOption === 'ONLINE') return label;
  const venue = addressMap.get(entry.locationAddressId || courseLocation.defaultSessionAddressId);
  const place = venue
    ? venueText(venue)
    : entry.address?.trim() || courseLocation.defaultSessionAddress?.trim() || '';
  return place ? `${label} – ${place}` : label;
};

/** The places of these address entries, in the order the course lists its locations. */
const placesOf = (entries, courseLocations, addressMap) => {
  const places = courseLocations.flatMap((courseLocation) =>
    entries
      .filter((entry) => entry.courseLocationId === courseLocation.id)
      .map((entry) => describePlace(courseLocation, entry, addressMap))
  );
  return [...new Set(places.filter(Boolean))];
};

/**
 * The identity of a set of places. A location without its own venue falls back
 * to the course default, so picking the default explicitly is the same place.
 */
const locationKey = (entries, courseLocations) =>
  entries
    .map((entry) => {
      const courseLocation = courseLocations.find((location) => location.id === entry.courseLocationId);
      return `${entry.courseLocationId}:${entry.locationAddressId || courseLocation?.defaultSessionAddressId || ''}`;
    })
    .sort()
    .join('|');

const timeOf = (value) => (value ? new Date(value).getTime() : NaN);

/** Every LocationAddress id the session's places may resolve through, before and after. */
export const referencedLocationAddressIds = (session, courseLocations, previous) => {
  const ids = [
    ...(session.SessionAddresses || []).map((entry) => entry.locationAddressId),
    ...(previous?.locations || []).map((entry) => entry.locationAddressId),
    ...courseLocations.map((courseLocation) => courseLocation.defaultSessionAddressId),
  ];
  return [...new Set(ids.filter((id) => Number.isInteger(id)))];
};

/**
 * What changed about a course session since `previous` (its time and
 * locations before the edits, sent by the Sessions tab), as the mail to send:
 * the template, its [#if:...] flags and the before/after values it shows.
 * Returns null when nothing a participant needs to hear about changed, e.g. a
 * location removed and added back again.
 *
 * Without a usable `previous` (an older client) only a new time is announced,
 * as before. Previous locations are only taken from the session's own course,
 * so the input cannot pull another course's venues into the mail.
 */
export function describeSessionChange({ session, courseLocations, previous, addressMap = new Map() }) {
  const previousStart = timeOf(previous?.startDateTime);
  const previousEnd = timeOf(previous?.endDateTime);
  if (!previous || Number.isNaN(previousStart) || Number.isNaN(previousEnd)) {
    return { templateType: 'SESSION_RESCHEDULED', flags: {} };
  }

  const timeChanged =
    previousStart !== timeOf(session.startDateTime) || previousEnd !== timeOf(session.endDateTime);
  const previousDateTimeRange = formatReminderDateTimeRange(previous.startDateTime, previous.endDateTime);

  const known = new Set(courseLocations.map((courseLocation) => courseLocation.id));
  const previousEntries = (previous.locations || []).filter((entry) => known.has(entry.courseLocationId));
  const currentEntries = (session.SessionAddresses || []).filter((entry) => known.has(entry.courseLocationId));

  if (locationKey(previousEntries, courseLocations) !== locationKey(currentEntries, courseLocations)) {
    return {
      templateType: 'SESSION_LOCATION_CHANGED',
      flags: { TimeChanged: timeChanged, TimeUnchanged: !timeChanged },
      previousDateTimeRange,
      locationList: placesOf(currentEntries, courseLocations, addressMap),
      previousLocationList: placesOf(previousEntries, courseLocations, addressMap),
    };
  }
  if (timeChanged) {
    return { templateType: 'SESSION_RESCHEDULED', flags: { PreviousTime: true }, previousDateTimeRange };
  }
  return null;
}
