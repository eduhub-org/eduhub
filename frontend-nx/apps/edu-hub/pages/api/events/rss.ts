import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerApolloClient } from '../../../config/apolloServer';
import { buildEventsRss } from '../../../helpers/eventsRss';
import { markdownToHtml } from '../../../helpers/markdownToHtml';
import { requestOrigin } from '../../../helpers/requestOrigin';
import { EVENTS_FEED } from '../../../queries/eventsFeed';
import { EventsFeed } from '../../../queries/__generated__/EventsFeed';
import de from '../../../locales/de.json';
import en from '../../../locales/en.json';

/**
 * RSS feed of the published events. Served publicly at `/events/rss.xml` and
 * `/en/events/rss.xml` through the rewrites in next.config.js; the English
 * variant arrives here with `?locale=en`.
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
    const { data } = await createServerApolloClient().query<EventsFeed>({ query: EVENTS_FEED });

    const xml = buildEventsRss(data?.Course ?? [], {
      title: messages.title,
      description: messages.description,
      language: locale,
      baseUrl: `${origin}${localePrefix}`,
      feedUrl: `${origin}${localePrefix}/events/rss.xml`,
      renderMarkdown: markdownToHtml,
    });

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    // Feed readers poll often; let a CDN absorb that instead of Hasura.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Failed to build events RSS feed', error);
    return res.status(502).end();
  }
}
