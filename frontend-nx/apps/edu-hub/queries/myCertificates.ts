import { gql } from '@apollo/client';
import { ENROLLMENT_FRAGMENT } from './enrollmentFragment';
import { COURSE_FRAGMENT_MINIMUM } from './courseFragment';
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from './programFragment';

export const MY_CERTIFICATES = gql`
  ${ENROLLMENT_FRAGMENT}
  ${COURSE_FRAGMENT_MINIMUM}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query MyCertificates($userId: uuid!) {
    CourseEnrollment(
      where: {
        userId: { _eq: $userId }
        _or: [
          { achievementCertificateURL: { _is_null: false } }
          { attendanceCertificateURL: { _is_null: false } }
        ]
      }
      order_by: { created_at: desc }
    ) {
      ...EnrollmentFragment
      Course {
        ...CourseFragmentMinimum
        coverImage
        Program {
          ...ProgramFragmentMinimumProperties
        }
      }
    }
  }
`;

