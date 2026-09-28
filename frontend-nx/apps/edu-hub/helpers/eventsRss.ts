/**
 * Events RSS Feed
 *
 * Turns the published events into an RSS 2.0 document for `/events/rss.xml`.
 * Kept pure (the caller passes "now" and every URL) so it can be unit-tested
 * without a request or a GraphQL server.
 */

import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { compareByUpcoming, formatSessionDateSpan, lastSessionEnd, ScheduleSession } from './sessionSchedule';

const TIME_ZONE = 'Europe/Berlin';

export type RssEvent = {
  id: number;
  title: string;
  tagline?: string | null;
  headingDescriptionField1?: string | null;
  contentDescriptionField1?: string | null;
  headingDescriptionField2?: string | null;
  contentDescriptionField2?: string | null;
  created_at: Date | string;
  Sessions?: ScheduleSession[] | null;
};

export interface EventsRssOptions {
  title: string;
  description: string;
  /** RSS language code of the channel, e.g. "de". */
  language: string;
  /** Locale-aware origin the course links hang off, e.g. "https://edu.example/en". */
  baseUrl: string;
  /** Absolute URL of the feed itself, for the atom:link self reference. */
  feedUrl: string;
  /** Renders a description field's Markdown to HTML for content:encoded. */
  renderMarkdown: (markdown: string) => string;
  now?: Date;
}

const escapeXml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Wraps HTML in CDATA, splitting any "]]>" so it cannot close the section early. */
const cdata = (html: string): string => `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

/** RFC 822 date, as RSS 2.0 requires. */
const rssDate = (value: Date | string): string => new Date(value).toUTCString();

/**
 * Events still worth announcing: anything whose last session ends today or
 * later (Berlin time, so an event stays listed for the rest of its final day),
 * plus events that have no sessions yet.
 */
export const selectCurrentEvents = <T extends RssEvent>(events: T[], now: Date): T[] => {
  const startOfToday = fromZonedTime(`${formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd')}T00:00:00`, TIME_ZONE);
  return events
    .filter((event) => {
      const end = lastSessionEnd(event.Sessions ?? []);
      return !end || end >= startOfToday;
    })
    .sort((a, b) => compareByUpcoming(a, b, now));
};

/**
 * The description fields as HTML, each a heading plus its body, in page order.
 * Mirrors `CourseContent/DescriptionFields.tsx`: the block only appears once
 * some field has both a heading and content, and then every field with either
 * one is shown. Null when the page would show nothing.
 */
export const renderDescriptionFields = (
  event: RssEvent,
  renderMarkdown: (markdown: string) => string
): string | null => {
  const fields = [
    { heading: event.headingDescriptionField1?.trim(), content: event.contentDescriptionField1?.trim() },
    { heading: event.headingDescriptionField2?.trim(), content: event.contentDescriptionField2?.trim() },
  ];
  if (!fields.some((field) => field.heading && field.content)) return null;

  return fields
    .filter((field) => field.heading || field.content)
    .map((field) =>
      [
        field.heading ? `<h2>${escapeXml(field.heading)}</h2>` : '',
        field.content ? renderMarkdown(field.content) : '',
      ].join('')
    )
    .join('');
};

const renderItem = (event: RssEvent, baseUrl: string, renderMarkdown: (markdown: string) => string): string => {
  const link = `${baseUrl}/course/${event.id}`;
  const description = [formatSessionDateSpan(event.Sessions ?? [], TIME_ZONE), event.tagline?.trim()]
    .filter(Boolean)
    .join(' – ');
  const content = renderDescriptionFields(event, renderMarkdown);

  return [
    '    <item>',
    `      <title>${escapeXml(event.title)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    description ? `      <description>${escapeXml(description)}</description>` : null,
    content ? `      <content:encoded>${cdata(content)}</content:encoded>` : null,
    `      <pubDate>${rssDate(event.created_at)}</pubDate>`,
    '    </item>',
  ]
    .filter((line) => line !== null)
    .join('\n');
};

export const buildEventsRss = (events: RssEvent[], options: EventsRssOptions): string => {
  const now = options.now ?? new Date();
  const items = selectCurrentEvents(events, now).map((event) =>
    renderItem(event, options.baseUrl, options.renderMarkdown)
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(options.title)}</title>`,
    `    <link>${escapeXml(options.baseUrl)}</link>`,
    `    <description>${escapeXml(options.description)}</description>`,
    `    <language>${escapeXml(options.language)}</language>`,
    `    <lastBuildDate>${rssDate(now)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(options.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};
