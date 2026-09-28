import { gql } from '@apollo/client';

/**
 * Every published event for the public RSS feed (`/events/rss.xml`).
 *
 * Runs as `anonymous` through the server Apollo client, whose row filter
 * already limits Course to published courses in published programs; the
 * explicit `published` conditions only document that intent. Which events are
 * still current is decided from the sessions in `helpers/eventsRss.ts`, since
 * a session's end may be null and falls back to its start.
 */
export const EVENTS_FEED = gql`
  query EventsFeed {
    Course(
      where: { published: { _eq: true }, Program: { published: { _eq: true }, type: { _eq: "EVENTS" } } }
    ) {
      id
      title
      tagline
      headingDescriptionField1
      contentDescriptionField1
      headingDescriptionField2
      contentDescriptionField2
      created_at
      Sessions(order_by: { startDateTime: asc }) {
        id
        startDateTime
        endDateTime
      }
    }
  }
`;
