import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "./courseFragment";

export const PARTICIPATING = gql`
  ${COURSE_FRAGMENT}
  query Participating($id: Int!) {
    Person_by_pk(Id: $id) {
      Participants {
        Enrollments {
          Course {
            ...CourseFragment
          }
        }
      }
    }
  }
`;
