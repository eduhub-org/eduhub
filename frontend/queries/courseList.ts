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

export const ADMIN_COURSE_LIST = gql`
  ${ADMIN_COURSE_FRAGMENT}
  query CourseList {
    Course {
      ...CourseFragment
    }
  }
`;
