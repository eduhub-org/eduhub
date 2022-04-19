import { gql } from "@apollo/client";
import { USER_FRAGMENT } from "./userFragment";

export const SESSION_FRAGMENT = gql`
  fragment SessionFragment on Session {
    id
    endDateTime
    courseId
    description
    startDateTime
    title
  }
`;

export const ADMIN_SESSION_FRAGMENT = gql`
  ${SESSION_FRAGMENT}
  ${USER_FRAGMENT}
  fragment AdminSessionFragment on Session {
    ...SessionFragment
    SessionAddresses {
      id
      link
    }
    SessionSpeakers {
      id
      Expert {
        id
        User {
          ...UserFragment
        }
      }
    }
  }
`;
