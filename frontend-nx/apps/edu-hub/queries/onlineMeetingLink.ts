import { gql } from '@apollo/client';

// Online meeting links live in their own table (OnlineMeetingLink) because the
// public address columns are readable by anyone. Hasura returns only the rows
// the caller may see: confirmed participants, instructors, managing org admins
// and admins; anonymous has no access to the table at all, so a query that may
// run as anonymous must not select it.

export const ONLINE_MEETING_LINK_FRAGMENT = gql`
  fragment OnlineMeetingLinkFragment on OnlineMeetingLink {
    id
    url
    courseLocationId
    sessionAddressId
  }
`;

/**
 * The links of a session's addresses and of their course locations. Only for
 * queries that run as a logged-in role (user, instructor, org_admin, admin).
 */
export const SESSION_ONLINE_LINKS_FRAGMENT = gql`
  fragment SessionOnlineLinksFragment on Session {
    id
    SessionAddresses {
      id
      OnlineMeetingLink {
        id
        url
      }
      CourseLocation {
        id
        OnlineMeetingLink {
          id
          url
        }
      }
    }
  }
`;

// Upserts for the link edit fields (InputField passes itemId and text).

export const UPSERT_COURSE_LOCATION_ONLINE_LINK = gql`
  ${ONLINE_MEETING_LINK_FRAGMENT}
  mutation UpsertCourseLocationOnlineLink($itemId: Int!, $text: String!) {
    insert_OnlineMeetingLink_one(
      object: { courseLocationId: $itemId, url: $text }
      on_conflict: { constraint: OnlineMeetingLink_courseLocationId_key, update_columns: [url] }
    ) {
      ...OnlineMeetingLinkFragment
    }
  }
`;

export const UPSERT_SESSION_ADDRESS_ONLINE_LINK = gql`
  ${ONLINE_MEETING_LINK_FRAGMENT}
  mutation UpsertSessionAddressOnlineLink($itemId: Int!, $text: String!) {
    insert_OnlineMeetingLink_one(
      object: { sessionAddressId: $itemId, url: $text }
      on_conflict: { constraint: OnlineMeetingLink_sessionAddressId_key, update_columns: [url] }
    ) {
      ...OnlineMeetingLinkFragment
    }
  }
`;
