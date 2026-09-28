import { gql } from '@apollo/client';

/**
 * A preview enrollment: the hidden CONFIRMED enrollment an instructor or admin
 * holds on their own course so they can see the participant view of it.
 *
 * It is created and removed through actions rather than through table
 * mutations - see the comment above select_permissions in
 * public_CourseEnrollment.yaml for why.
 */
export const MY_TEST_ENROLLMENT = gql`
  query MyTestEnrollment($courseId: Int!, $userId: uuid!) {
    CourseEnrollment(
      where: {
        courseId: { _eq: $courseId }
        userId: { _eq: $userId }
        isTest: { _eq: true }
      }
      limit: 1
    ) {
      id
      status
      isTest
    }
  }
`;

export const CREATE_TEST_ENROLLMENT = gql`
  mutation CreateTestEnrollment($courseId: Int!) {
    createTestEnrollment(courseId: $courseId) {
      success
      messageKey
      enrollmentId
    }
  }
`;

export const REMOVE_TEST_ENROLLMENT = gql`
  mutation RemoveTestEnrollment($courseId: Int!) {
    removeTestEnrollment(courseId: $courseId) {
      success
      messageKey
      enrollmentId
    }
  }
`;
