import { gql } from '@apollo/client';

/**
 * The other people taking part in a course.
 *
 * The query only names the course: who may read it at all is decided by the
 * CourseParticipant permission, which requires the caller to be a confirmed or
 * completed participant of that same course. The view carries no enrollment
 * status, so this cannot reveal who merely applied.
 */
export const COURSE_PARTICIPANTS = gql`
  query CourseParticipants($courseId: Int!, $limit: Int = 48) {
    CourseParticipant(
      where: { courseId: { _eq: $courseId } }
      order_by: { User: { firstName: asc, lastName: asc } }
      limit: $limit
    ) {
      userId
      User {
        id
        firstName
        lastName
        picture
        externalProfile
        matrixUserHandle
      }
    }
    CourseParticipant_aggregate(where: { courseId: { _eq: $courseId } }) {
      aggregate {
        count
      }
    }
  }
`;
