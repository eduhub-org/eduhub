/**
 * Events iCal Feed
 *
 * Turns the published events into an iCalendar subscription for
 * `/events/calendar.ics`. Event portals such as wasgehtinkiel.de import events
 * from iCal feeds rather than RSS, since only iCal carries machine-readable
 * start, end and location.
 *
 * Every session becomes its own VEVENT, so a multi-day event is listed on each
 * of its dates. Kept pure (the caller passes "now", the resolved addresses and
 * every URL) so it can be unit-tested without a request or a GraphQL server.
 */

import { getPublicImageUrl } from './filehandling';
import { generateICalString } from './icalExport';
import { RssEvent, selectCurrentEvents } from './eventsRss';
import { AddressMap, resolveSessionLocations, ResolvableSession, ResolvedLocation } from './sessionLocationResolution';

const TIME_ZONE = 'Europe/Berlin';

export type IcalFeedSession = ResolvableSession & {
  id: number;
  title?: string | null;
  startDateTime: Date | string;
  endDateTime?: Date | string | null;
};

export type IcalFeedEvent = Omit<RssEvent, 'Sessions'> & {
  coverImage?: string | null;
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
  /** Renders a description field's Markdown to plain text for DESCRIPTION. */
  renderPlainText: (markdown: string) => string;
  categories?: string[];
  now?: Date;
}

/** Anything that looks like a link, so a meeting URL can never pass as an address. */
const LINK_PATTERN = /(https?:\/\/|www\.)/i;

/** "KIEL" → "Kiel": the city every offline location option stands for. */
const cityName = (locationOption: string): string =>
  locationOption.charAt(0).toUpperCase() + locationOption.slice(1).toLowerCase();

/**
 * The LOCATION line for one session. Online places are written as just
 * "Online": the stored address of an online session is its meeting link, and
 * this feed is public. Offline addresses get their city appended when they do
 * not already name it, so importers can geocode entries like "Room 2.12".
 */
export const feedLocation = (locations: ResolvedLocation[]): string | undefined => {
  const parts = locations.map((location) => {
    if (!location.locationOption) return null;
    if (location.locationOption === 'ONLINE') return 'Online';

    const city = cityName(location.locationOption);
    const address = location.displayAddress.trim();
    if (!address || LINK_PATTERN.test(address)) return city;
    return address.toLowerCase().includes(city.toLowerCase()) ? address : `${address}, ${city}`;
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

/** Tagline, then each description field as a heading line plus its text, then the course link. */
const describe = (event: IcalFeedEvent, link: string, renderPlainText: (markdown: string) => string): string =>
  [
    event.tagline?.trim(),
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

export const buildEventsIcal = (events: IcalFeedEvent[], options: EventsIcalOptions): string => {
  const now = options.now ?? new Date();

  const entries = selectCurrentEvents(events, now).flatMap((event) => {
    const sessions = event.Sessions ?? [];
    const link = `${options.baseUrl}/course/${event.id}`;
    const description = describe(event, link, options.renderPlainText);
    const imageUrl = getPublicImageUrl(event.coverImage ?? null, 1280) ?? undefined;
    const lastModified = toDate(event.updated_at)?.toISOString();

    return sessions.flatMap((session) => {
      const start = toDate(session.startDateTime);
      if (!start) return [];
      const end = toDate(session.endDateTime) ?? start;
      if (end < now) return [];

      const sessionTitle = session.title?.trim();
      const title =
        sessions.length > 1 && sessionTitle && sessionTitle !== event.title ? `${event.title} – ${sessionTitle}` : event.title;

      return [
        {
          uid: `session-${session.id}@eduhub`,
          title,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          description,
          location: feedLocation(resolveSessionLocations(session, event.CourseLocations ?? [], options.addressMap)),
          url: link,
          categories: options.categories,
          imageUrl,
          lastModified,
        },
      ];
    });
  });

  entries.sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  return generateICalString(entries, options.calendarName, {
    timeZone: TIME_ZONE,
    refreshInterval: 'PT6H',
    now,
  });
};
