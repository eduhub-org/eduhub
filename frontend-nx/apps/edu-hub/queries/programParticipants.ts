import { gql } from '@apollo/client';

// Confirmed participants across all courses of a program, for the program's BCC mail button.
// Test enrollments are left out, as in the statistics.
export const PROGRAM_PARTICIPANT_EMAILS = gql`
  query ProgramParticipantEmails($programId: Int!) {
    CourseEnrollment(
      where: { Course: { programId: { _eq: $programId } }, status: { _eq: CONFIRMED }, isTest: { _eq: false } }
    ) {
      id
      User {
        id
        email
      }
    }
  }
`;
