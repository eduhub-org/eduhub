import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";

export const COURSE_LIST = gql`
  ${COURSE_FRAGMENT}
  query CourseList {
    Course {
      ...CourseFragment
    }
  }
`;
