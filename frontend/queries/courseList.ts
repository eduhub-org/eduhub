import { gql } from "@apollo/client";

import { ADMIN_COURSE_FRAGMENT, COURSE_FRAGMENT } from "./courseFragment";

export const COURSE_LIST = gql`
  ${COURSE_FRAGMENT}
  query CourseList {
    Course {
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

export const COURSE_LIST_WITH_FILTER = gql`
  ${ADMIN_COURSE_FRAGMENT}
  query CourseListWithFilter($whereAndClause: [Course_bool_exp!]) {
    Course(order_by: { id: desc }, where: { _and: $whereAndClause }) {
      ...AdminCourseFragment
    }
  }
`;

export const COURSE_LIST_FOR_SINGLE_INSTRUCTOR = gql`
  ${COURSE_FRAGMENT}
  query CoursesSingleInstructor($expertId: Int!) {
    Course(
      order_by: { id: desc }
      where: { CourseInstructors: { expertId: { _eq: $expertId } } }
    ) {
      ...CourseFragment
    }
  }
`;
