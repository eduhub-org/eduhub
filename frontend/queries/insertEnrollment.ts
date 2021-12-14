import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const INSERT_ENROLLMENT = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  mutation InsertEnrollment(
    $userId: uuid!
    $courseId: Int!
    $motivationLetter: String!
  ) {
    insert_CourseEnrollment(
      objects: {
        userId: $userId
        courseId: $courseId
        motivationLetter: $motivationLetter
      }
    ) {
      affected_rows
      returning {
        ...EnrollmentFragment
        Course {
          ...CourseFragment
          CourseEnrollments {
            ...EnrollmentFragment
          }
        }
      }
    }
  }
`;
