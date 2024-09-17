import { graphql } from '../../../types/generated';

export const MULTI_PROGRAM_ENROLLMENTS = graphql(`
  query MultiProgramEnrollments($programIds: [Int!]) {
    Program(where: { id: { _in: $programIds } }) {
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
`);
