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

export const UPDATE_ENROLLMENT_RATING = gql`
  mutation UpdateEnrollmentRating(
    $enrollmentId: Int!
    $rating: MotivationRating_enum!
  ) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { motivationRating: $rating }
    ) {
      id
    }
  }
`;

export const UPDATE_ENROLLMENT_FOR_INVITE = gql`
  mutation UpdateEnrollmentForInvite($enrollmentId: Int!, $expire: date!) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { invitationExpirationDate: $expire, status: INVITED }
    ) {
      id
    }
  }
`;

export const UPDATE_ENROLLMENT_STATUS = gql`
  mutation UpdateEnrollmentStatus($enrollmentId: Int!, $status: CourseEnrollmentStatus_enum!) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { status: $status }
    ) {
      id
    }
  }
`;
