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

/**
 * Records the user's acceptance of Terms & Conditions and Privacy Policy
 * for an existing enrollment.
 *
 * Timestamp semantics: callers pass a client-generated ISO timestamp that
 * is captured at summary submission, immediately before the Stripe
 * checkout session is created. The user must have ticked the consent
 * checkbox earlier in the same submit handler; this mutation records the
 * moment that consent is acted upon.
 *
 * Legal note: the column is only set when it is currently NULL — once an
 * acceptance is recorded it is immutable from this mutation, which prevents
 * the audit trail from being overwritten on retries. As a consequence,
 * `affected_rows: 0` is the *expected* response for an idempotent retry
 * after the row already has a value; callers must therefore distinguish
 * "no-op because already recorded" from "no row matched at all" by
 * issuing GET_ENROLLMENT_TERMS_ACCEPTED_AT as a follow-up read.
 */
export const UPDATE_ENROLLMENT_TERMS_ACCEPTED = gql`
  mutation UpdateEnrollmentTermsAccepted(
    $enrollmentId: Int!
    $termsAcceptedAt: timestamptz!
  ) {
    update_CourseEnrollment(
      where: {
        _and: [
          { id: { _eq: $enrollmentId } }
          { termsAcceptedAt: { _is_null: true } }
        ]
      }
      _set: { termsAcceptedAt: $termsAcceptedAt }
    ) {
      affected_rows
      returning {
        id
        termsAcceptedAt
      }
    }
  }
`;

/**
 * Verification read used after UPDATE_ENROLLMENT_TERMS_ACCEPTED reports
 * `affected_rows: 0`. A null value means we must NOT proceed to checkout
 * (no consent on record); a non-null value means consent was already
 * recorded on a previous attempt and it is safe to proceed.
 */
export const GET_ENROLLMENT_TERMS_ACCEPTED_AT = gql`
  query GetEnrollmentTermsAcceptedAt($enrollmentId: Int!) {
    CourseEnrollment_by_pk(id: $enrollmentId) {
      id
      termsAcceptedAt
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
