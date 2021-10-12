import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";

export const COURSE = gql`
  ${COURSE_FRAGMENT}
  query Course($id: Int!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
    }
  }
`;
