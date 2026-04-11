import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";

export const UPDATE_ENROLLMENT = gql`
  mutation UpdateEnrollment(
    $userId: uuid!
    $courseId: Int!
    $motivationLetter: String!
    $status: CourseEnrollmentStatus_enum!
    $termsAcceptedAt: timestamptz
  ) {
    insert_CourseEnrollment(
      objects: {
        userId: $userId
        courseId: $courseId
        motivationLetter: $motivationLetter,
        status: $status
        termsAcceptedAt: $termsAcceptedAt
      },
      on_conflict: {
        constraint: uniqueUserCourse,
        update_columns: [status, termsAcceptedAt]
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

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
  mutation UpdateEnrollmentStatus(
    $enrollmentId: Int!,
    $status: CourseEnrollmentStatus_enum!,
    $expire: date
  ) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId },
      _set: { status: $status, invitationExpirationDate: $expire }
    ) {
      id
    }
  }
`;

/** Bulk status change only for rows still APPLIED or WAITLIST (avoids duplicate invite/decline emails on race). */
export const UPDATE_ENROLLMENT_STATUS_WHEN_APPLIED = gql`
  mutation UpdateEnrollmentStatusWhenApplied(
    $enrollmentIds: [Int!]!
    $status: CourseEnrollmentStatus_enum!
    $expire: date
  ) {
    update_CourseEnrollment(
      where: {
        _and: [
          { id: { _in: $enrollmentIds } }
          { status: { _in: [APPLIED, WAITLIST] } }
        ]
      }
      _set: { status: $status, invitationExpirationDate: $expire }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

/** Bulk invite update for APPLIED, WAITLIST, or already INVITED rows (supports invite resend/deadline changes). */
export const UPDATE_ENROLLMENT_STATUS_FOR_INVITE = gql`
  mutation UpdateEnrollmentStatusForInvite(
    $enrollmentIds: [Int!]!
    $status: CourseEnrollmentStatus_enum!
    $expire: date
  ) {
    update_CourseEnrollment(
      where: {
        _and: [
          { id: { _in: $enrollmentIds } }
          { status: { _in: [APPLIED, INVITED, WAITLIST] } }
        ]
      }
      _set: { status: $status, invitationExpirationDate: $expire }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;
