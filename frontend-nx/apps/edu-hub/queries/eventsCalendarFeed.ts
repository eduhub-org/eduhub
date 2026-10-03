import { gql } from '@apollo/client';

/**
 * Every published event with its sessions and places, for the public iCal feed
 * (`/events/calendar.ics`), which event portals such as wasgehtinkiel.de import.
 *
 * Runs as `anonymous` through the server Apollo client, like `EVENTS_FEED`.
 * `SessionAddress.address` is selected only as an address fallback: for online
 * sessions it holds the meeting link, which `helpers/eventsIcal.ts` never
 * writes into the public feed.
 */
export const EVENTS_CALENDAR_FEED = gql`
  query EventsCalendarFeed {
    Course(
      where: { published: { _eq: true }, Program: { published: { _eq: true }, type: { _eq: "EVENTS" } } }
    ) {
      id
      title
      tagline
      coverImage
      registrationType
      headingDescriptionField1
      contentDescriptionField1
      headingDescriptionField2
      contentDescriptionField2
      created_at
      updated_at
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
        defaultSessionAddressId
      }
      Sessions(order_by: { startDateTime: asc }) {
        id
        title
        startDateTime
        endDateTime
        programId
        SessionAddresses {
          id
          address
          locationAddressId
          locationOption
          CourseLocation {
            id
            locationOption
            defaultSessionAddress
            defaultSessionAddressId
          }
        }
      }
    }
  }
`;
