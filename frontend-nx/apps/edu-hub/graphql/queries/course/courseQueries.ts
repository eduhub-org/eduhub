import { graphql } from '../../../types/generated';

export const COURSE_TILES = graphql(`
  query CourseTiles {
    Course(order_by: { updated_at: desc }) {
      ...CourseTileFragment
      CourseGroups {
        CourseGroupOption {
          order
          title
        }
      }
    }
  }
`);

export const COURSES_BY_INSTRUCTOR = graphql(`
  query CoursesByInstructor($userId: uuid!) {
    Course(
      order_by: { applicationEnd: desc }
      where: { CourseInstructors: { Expert: { User: { id: { _eq: $userId } } } } }
    ) {
      ...CourseTileFragment
    }
  }
`);

export const COURSES_ENROLLED_BY_USER = graphql(`
  query CoursesEnrolledByUser($userId: uuid!) {
    Course(order_by: { applicationEnd: desc }, where: { CourseEnrollments: { userId: { _eq: $userId } } }) {
      ...CourseTileFragment
    }
  }
`);
