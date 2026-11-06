import { gql } from '@apollo/client';

// Attendances of one Session for its statistics and the raw-data dialog.
export const SESSION_ATTENDANCES = gql`
  query SessionAttendances($sessionId: Int!) {
    Attendance(where: { sessionId: { _eq: $sessionId } }) {
      id
      userId
      status
      source
      location
      attendanceRecordIndex
      recordedIdentifier
      matchType
      User {
        id
        firstName
        lastName
      }
    }
  }
`;
