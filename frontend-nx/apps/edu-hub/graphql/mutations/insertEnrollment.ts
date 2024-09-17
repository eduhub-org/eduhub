import { graphql } from '../../types/generated';

export const UPDATE_ENROLLMENT = graphql(`
  mutation UpdateEnrollment(
    $userId: uuid!
    $courseId: Int!
    $motivationLetter: String!
    $status: CourseEnrollmentStatus_enum!
  ) {
    insert_CourseEnrollment(
      objects: { userId: $userId, courseId: $courseId, motivationLetter: $motivationLetter, status: $status }
      on_conflict: { constraint: uniqueUserCourse, update_columns: [status] }
    ) {
      affected_rows
    }
  }
`);

export const INSERT_ENROLLMENT = graphql(`
  mutation InsertEnrollment($userId: uuid!, $courseId: Int!, $motivationLetter: String!) {
    insert_CourseEnrollment(objects: { userId: $userId, courseId: $courseId, motivationLetter: $motivationLetter }) {
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
`);

export const UPDATE_ENROLLMENT_RATING = graphql(`
  mutation UpdateEnrollmentRating($enrollmentId: Int!, $rating: MotivationRating_enum!) {
    update_CourseEnrollment_by_pk(pk_columns: { id: $enrollmentId }, _set: { motivationRating: $rating }) {
      id
    }
  }
`);

export const UPDATE_ENROLLMENT_FOR_INVITE = graphql(`
  mutation UpdateEnrollmentForInvite($enrollmentId: Int!, $expire: date!) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { invitationExpirationDate: $expire, status: INVITED }
    ) {
      id
    }
  }
`);

export const UPDATE_ENROLLMENT_STATUS = graphql(`
  mutation UpdateEnrollmentStatus($enrollmentId: Int!, $status: CourseEnrollmentStatus_enum!, $expire: date) {
    update_CourseEnrollment_by_pk(
      pk_columns: { id: $enrollmentId }
      _set: { status: $status, invitationExpirationDate: $expire }
    ) {
      id
    }
  }
`);
