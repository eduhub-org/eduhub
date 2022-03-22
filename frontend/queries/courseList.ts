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
 * $programShortTitle/ $title = "%%" or %something%
 *
 */
export const COURSE_LIST_WITH_FILTER = gql`
  ${ADMIN_COURSE_FRAGMENT}
  query CourseListWithFilter(
    $courseTitle: String!
    $programShortTitle: String!
  ) {
    Course(
      order_by: { id: desc }
      where: {
        _and: [
          { title: { _ilike: $courseTitle } }
          { Program: { _or: [{ shortTitle: { _ilike: $programShortTitle } }] } }
        ]
      }
    ) {
      ...AdminCourseFragment
    }
  }
`;
