import { gql } from '@apollo/client';

/**
 * Creates the public event for a course session. Only the course row is sent:
 * a database trigger copies the session, its locations and speakers from
 * `sourceSessionId` and keeps them in sync afterwards.
 */
export const CREATE_EVENT_FROM_SESSION = gql`
  mutation CreateEventFromSession($event: Course_insert_input!) {
    insert_Course_one(object: $event) {
      id
    }
  }
`;
