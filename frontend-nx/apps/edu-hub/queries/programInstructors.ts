import { gql } from '@apollo/client';

// Instructor email addresses of all courses of a program, for the program-wide
// "email all instructors" button on the manage programs page.
export const PROGRAM_INSTRUCTOR_EMAILS = gql`
  query ProgramInstructorEmails($programId: Int!) {
    Course(where: { programId: { _eq: $programId } }) {
      id
      CourseInstructors {
        id
        User {
          id
          email
        }
      }
    }
  }
`;
