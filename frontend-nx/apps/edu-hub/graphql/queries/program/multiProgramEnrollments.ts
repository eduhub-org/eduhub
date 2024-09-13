import { gql } from '@apollo/client';

export const MULTI_PROGRAM_ENROLLMENTS = gql`
  query MultiProgramEnrollments($programIds: [Int!]) {
    Program(where: {id: {_in: $programIds}}) {
      id
      title
      shortTitle
      Courses {
        id
        title
        CourseEnrollments {
          id
          status
          attendanceCertificateURL
          achievementCertificateURL
          created_at
          updated_at
        }
      }
    }
  }
`;
