import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const INSERT_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  mutation InsertEnrollment(
    $participantId: Int!
    $courseId: Int!
    $motivationLetter: String!
  ) {
    insert_Enrollment(
      objects: {
        ParticipantId: $participantId
        CourseId: $courseId
        MotivationLetter: $motivationLetter
        WantsEcts: false
      }
    ) {
      affected_rows
      returning {
        ...EnrollmentFragment
        Course {
          ...CourseFragment
          Enrollments {
            ...EnrollmentFragment
          }
        }
      }
    }
  }
`;
