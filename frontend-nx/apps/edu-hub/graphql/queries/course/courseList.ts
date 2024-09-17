import { graphql } from '../../../types/generated';

export const COURSE_LIST_ANONYMOUS = graphql(`
  query CourseTileListAnonymous {
    Course(order_by: { id: desc }) {
      ...CourseTileFragmentAnonymous
    }
  }
`);

export const COURSE_LIST = graphql(`
  query CourseList {
    Course(order_by: { updated_at: desc }) {
      ...CourseFragment
    }
  }
`);

/**
 *
 * shortTitle: {} means null
 *
 * We have to carefull here:
 *
 * $courseTitle = "%%" or %something%
 *
 */

export const ADMIN_COURSE_LIST = graphql(`
  query AdminCourseList($where: Course_bool_exp! = {}, $limit: Int = null, $offset: Int = 0) {
    Course(order_by: { id: desc }, where: $where, limit: $limit, offset: $offset) {
      ...AdminCourseFragment
      Program {
        ...ProgramFragmentMinimumProperties
      }
      CourseEnrollments {
        id
        CourseEnrollmentStatus {
          value
        }
      }
      CourseGroups {
        id
        groupOptionId
        CourseGroupOption {
          title
        }
      }
      CourseDegrees {
        id
        degreeCourseId
        Course {
          title
        }
        DegreeCourse {
          title
        }
      }
      AppliedAndUnratedCount: CourseEnrollments_aggregate(
        where: {
          _and: [
            { CourseEnrollmentStatus: { value: { _eq: "APPLIED" } } }
            { MotivationRating: { value: { _eq: "UNRATED" } } }
          ]
        }
      ) {
        aggregate {
          count
        }
      }
    }
    Course_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    CourseGroupOption {
      id
      title
      order
    }
  }
`);
