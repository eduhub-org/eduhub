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
    # Participants (guests and direct sign-ups are REGISTERED) of the session's course, or of
    # every course of the program for a program-wide session: the attendance denominator.
    Participants: CourseEnrollment(
      where: {
        isTest: { _eq: false }
        status: { _in: [CONFIRMED, REGISTERED, COMPLETED] }
        Course: {
          _or: [
            { Sessions: { id: { _eq: $sessionId } } }
            { Program: { Sessions: { id: { _eq: $sessionId } } } }
          ]
        }
      }
    ) {
      id
      userId
    }
  }
`;
