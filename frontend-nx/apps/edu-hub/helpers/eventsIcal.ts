/**
 * Events iCal Feed
 *
 * Turns the published events into an iCalendar subscription for
 * `/events/calendar.ics`. Event portals such as wasgehtinkiel.de import events
 * from iCal feeds rather than RSS, since only iCal carries machine-readable
 * start, end and location.
 *
 * Every run of back-to-back sessions becomes its own VEVENT: a multi-day event
 * is listed on each of its dates and a break splits a day, while a talk followed
 * directly by a get-together forms a single entry. Kept pure (the caller passes "now", the resolved addresses and
 * every URL) so it can be unit-tested without a request or a GraphQL server.
 */

import { getPublicImageUrl } from './filehandling';
import { generateICalString } from './icalExport';
import { RssEvent, selectCurrentEvents } from './eventsRss';
import { blockSchedule, contiguousBlocks, TimedSession } from './sessionSchedule';
import {
  AddressMap,
  labelledAddress,
  meaningfulLabel,
  resolveSessionLocations,
  ResolvableSession,
  ResolvedLocation,
} from './sessionLocationResolution';

const TIME_ZONE = 'Europe/Berlin';

export type IcalFeedSession = ResolvableSession & {
  id: number;
  title?: string | null;
  startDateTime: Date | string;
  endDateTime?: Date | string | null;
};

export type IcalFeedEvent = Omit<RssEvent, 'Sessions'> & {
  coverImage?: string | null;
  registrationType?: string | null;
  updated_at?: Date | string | null;
  CourseLocations?: { id: number }[] | null;
  Sessions?: IcalFeedSession[] | null;
};

export interface EventsIcalOptions {
  calendarName: string;
  /** Locale-aware origin the course links hang off, e.g. "https://edu.example/en". */
  baseUrl: string;
  /** LocationAddress rows referenced by the sessions, by id. */
  addressMap: AddressMap;
  /** Short label of the place a free-text address names, see `labelLookup`. */
  labelByAddress?: LabelLookup;
  /** Renders a description field's Markdown to plain text for DESCRIPTION. */
  renderPlainText: (markdown: string) => string;
  categories?: string[];
  now?: Date;
}

export type LabelLookup = (locationOption: string, address: string) => string | undefined;

const normalizeAddress = (text: string): string => text.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Finds the LocationAddress a free-text address names, by its address or one
 * of its aliases within the same location option, so legacy sessions that only
 * store text like "Kuhnkestr. 6" still get the place's short label.
 */
export const labelLookup = (
  addresses: { shortLabel: string; address: string; aliases?: unknown; locationOption: string }[]
): LabelLookup => {
  const labels = new Map<string, string>();
  addresses.forEach(({ shortLabel, address, aliases, locationOption }) => {
    const label = meaningfulLabel(shortLabel);
    if (!label) return;
    const names = [address, ...(Array.isArray(aliases) ? aliases : [])].filter(
      (name): name is string => typeof name === 'string' && name.trim() !== ''
    );
    names.forEach((name) => {
      const key = `${locationOption}|${normalizeAddress(name)}`;
      if (!labels.has(key)) labels.set(key, label);
    });
  });
  return (locationOption, address) => labels.get(`${locationOption}|${normalizeAddress(address)}`);
};

/** Anything that looks like a link, so a meeting URL can never pass as an address. */
const LINK_PATTERN = /(https?:\/\/|www\.)/i;

/**
 * How people get into an event, for importers that leave out events needing
 * prior sign-up. Mirrors `getRegistrationFeatures`: a course without a
 * registration type goes through the application process.
 */
export const registrationKind = (registrationType?: string | null): 'PAID' | 'APPLICATION' | 'REGISTRATION' => {
  if (registrationType?.includes('PAYMENT')) return 'PAID';
  if (!registrationType || registrationType.startsWith('APPROVAL')) return 'APPLICATION';
  return 'REGISTRATION';
};

/** "KIEL" → "Kiel": the city every offline location option stands for. */
const cityName = (locationOption: string): string =>
  locationOption.charAt(0).toUpperCase() + locationOption.slice(1).toLowerCase();

/**
 * The LOCATION line for one entry. Online places are written as just
 * "Online": the stored address of an online session is its meeting link, and
 * this feed is public. Offline addresses get their city appended when they do
 * not already name it, so importers can geocode entries like "Room 2.12", and
 * are preceded by the place's short label, e.g. "Coworking (Kuhnkestr. 6, Kiel)",
 * since importers match venues by name.
 */
export const feedLocation = (locations: ResolvedLocation[]): string | undefined => {
  const parts = locations.map((location) => {
    if (!location.locationOption) return null;
    if (location.locationOption === 'ONLINE') return 'Online';

    const city = cityName(location.locationOption);
    const address = location.displayAddress.trim();
    const fullAddress =
      !address || LINK_PATTERN.test(address)
        ? city
        : address.toLowerCase().includes(city.toLowerCase())
        ? address
        : `${address}, ${city}`;
    const label = location.label && !LINK_PATTERN.test(location.label) ? location.label : undefined;
    return labelledAddress(label, fullAddress, address);
  });

  const unique = [...new Set(parts.filter((part): part is string => Boolean(part)))];
  return unique.length > 0 ? unique.join(' – ') : undefined;
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/**
 * Rendered Markdown HTML as readable plain text: blocks become paragraphs,
 * list items get a bullet and a line each, links keep their target, the rest
 * of the markup is dropped and the common entities are decoded.
 */
export const htmlToPlainText = (html: string): string =>
  html
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href: string, text: string) =>
      text.trim() && text.trim() !== href ? `${text} (${href})` : href
    )
    .replace(/>\s*\n\s*</g, '><')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>\s*|<\/(li|tr)>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|blockquote|pre|ul|ol|table)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === '#') {
        const codePoint = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Tagline, then the day's schedule when it has several sessions, then each
 * description field as a heading line plus its text, then the course link.
 */
const describe = (
  event: IcalFeedEvent,
  link: string,
  renderPlainText: (markdown: string) => string,
  schedule?: string
): string =>
  [
    event.tagline?.trim(),
    schedule,
    ...[
      { heading: event.headingDescriptionField1?.trim(), content: event.contentDescriptionField1?.trim() },
      { heading: event.headingDescriptionField2?.trim(), content: event.contentDescriptionField2?.trim() },
    ]
      .filter((field) => field.content)
      .map((field) => [field.heading, renderPlainText(field.content as string)].filter(Boolean).join('\n')),
    link,
  ]
    .filter(Boolean)
    .join('\n\n')
    .replace(/\r\n?/g, '\n');

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (value == null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

type UpcomingSession = TimedSession<IcalFeedSession>;

export const buildEventsIcal = (events: IcalFeedEvent[], options: EventsIcalOptions): string => {
  const now = options.now ?? new Date();

  const entries = selectCurrentEvents(events, now).flatMap((event) => {
    const sessions = event.Sessions ?? [];
    const link = `${options.baseUrl}/course/${event.id}`;
    const imageUrl = getPublicImageUrl(event.coverImage ?? null, 1280) ?? undefined;
    const lastModified = toDate(event.updated_at)?.toISOString();
    const extraProperties = { 'X-EDUHUB-REGISTRATION': registrationKind(event.registrationType) };

    const upcoming = sessions.flatMap((session): UpcomingSession[] => {
      const start = toDate(session.startDateTime);
      if (!start) return [];
      const end = toDate(session.endDateTime) ?? start;
      return end < now ? [] : [{ session, start, end }];
    });

    return contiguousBlocks(upcoming, TIME_ZONE).map((day) => {
      const first = day[0];
      const end = new Date(Math.max(...day.map((item) => item.end.getTime())));

      let title = event.title;
      let schedule: string | undefined;
      if (day.length > 1) {
        schedule = blockSchedule(day, event.title, TIME_ZONE);
      } else {
        const sessionTitle = first.session.title?.trim();
        if (sessions.length > 1 && sessionTitle && sessionTitle !== event.title) title = `${event.title} – ${sessionTitle}`;
      }

      return {
        uid: `session-${first.session.id}@eduhub`,
        title,
        startDateTime: first.start.toISOString(),
        endDateTime: end.toISOString(),
        description: describe(event, link, options.renderPlainText, schedule),
        location: feedLocation(
          day
            .flatMap(({ session }) => resolveSessionLocations(session, event.CourseLocations ?? [], options.addressMap))
            .map((location) =>
              location.label || !location.locationOption || !options.labelByAddress
                ? location
                : { ...location, label: options.labelByAddress(location.locationOption, location.displayAddress) }
            )
        ),
        url: link,
        categories: options.categories,
        imageUrl,
        lastModified,
        extraProperties,
      };
    });
  });

  entries.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  return generateICalString(entries, options.calendarName, {
    timeZone: TIME_ZONE,
    refreshInterval: 'PT6H',
    now,
  });
};
