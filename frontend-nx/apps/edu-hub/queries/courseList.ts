import { gql } from '@apollo/client';

import { ADMIN_COURSE_FRAGMENT, COURSE_FRAGMENT, COURSE_TILE_FRAGMENT_ANONYMOUS } from './courseFragment';
import { PROGRAM_FRAGMENT_MINIMUM_PROPERTIES } from './programFragment';

export const COURSE_LIST_ANONYMOUS = gql`
  ${COURSE_TILE_FRAGMENT_ANONYMOUS}
  query CourseTileListAnonymous($where: Course_bool_exp! = {}) {
    Course(order_by: { id: desc }) {
      ...CourseTileFragmentAnonymous
    }
  }
`;

export const COURSE_LIST = gql`
  ${COURSE_FRAGMENT}
  query CourseList($where: Course_bool_exp! = {}) {
    Course(order_by: { id: desc }) {
      ...CourseFragment
    }
  }
`;

/**
 *
 * shortTitle: {} means null
 *
 * We have to carefull here:
 *
 * $courseTitle = "%%" or %something%
 *
 */

export const ADMIN_COURSE_LIST = gql`
  ${ADMIN_COURSE_FRAGMENT}
  ${PROGRAM_FRAGMENT_MINIMUM_PROPERTIES}
  query AdminCourseList(
    $where: Course_bool_exp! = {}
    $limit: Int = null
    $offset: Int = 0
  ) {
    Course(
      order_by: { id: desc }
      where: $where
      limit: $limit
      offset: $offset
    ) {
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
  }
`;
