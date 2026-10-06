import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerApolloClient } from '../../../config/apolloServer';
import { buildEventsIcal, htmlToPlainText, labelLookup } from '../../../helpers/eventsIcal';
import { markdownToHtml } from '../../../helpers/markdownToHtml';
import { requestOrigin } from '../../../helpers/requestOrigin';
import { AddressMap } from '../../../helpers/sessionLocationResolution';
import { EVENTS_CALENDAR_FEED } from '../../../queries/eventsCalendarFeed';
import { LOCATION_ADDRESSES_FOR_FEED } from '../../../queries/locationAddress';
import { EventsCalendarFeed } from '../../../queries/__generated__/EventsCalendarFeed';
import { LocationAddressesForFeed } from '../../../queries/__generated__/LocationAddressesForFeed';
import de from '../../../locales/de.json';
import en from '../../../locales/en.json';

/**
 * iCal feed of the published events, one entry per session. Served publicly at
 * `/events/calendar.ics` and `/en/events/calendar.ics` through the rewrites in
 * next.config.js; the English variant arrives here with `?locale=en`.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const locale = req.query.locale === 'en' ? 'en' : 'de';
  const messages = (locale === 'en' ? en : de).eventsFeed;
  const origin = requestOrigin(req);
  const localePrefix = locale === 'en' ? '/en' : '';

  try {
    const client = createServerApolloClient();
    const [{ data }, { data: addressData }] = await Promise.all([
      client.query<EventsCalendarFeed>({ query: EVENTS_CALENDAR_FEED }),
      client.query<LocationAddressesForFeed>({ query: LOCATION_ADDRESSES_FOR_FEED }),
    ]);
    const events = data?.Course ?? [];

    // All of them, not just the referenced ids: free-text addresses are matched too.
    const addresses = addressData?.LocationAddress ?? [];
    const addressMap: AddressMap = new Map(addresses.map((address) => [address.id, address]));

    const ics = buildEventsIcal(events, {
      calendarName: messages.title,
      baseUrl: `${origin}${localePrefix}`,
      addressMap,
      labelByAddress: labelLookup(addresses),
      renderPlainText: (markdown) => htmlToPlainText(markdownToHtml(markdown, origin)),
      categories: [messages.icalCategory],
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="events.ics"');
    // Calendar importers poll often; let a CDN absorb that instead of Hasura.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(ics);
  } catch (error) {
    console.error('Failed to build events iCal feed', error);
    return res.status(502).end();
  }
}
