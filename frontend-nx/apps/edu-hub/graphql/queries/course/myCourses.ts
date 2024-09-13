import { gql } from "@apollo/client";

import { COURSE_FRAGMENT } from "../../fragments/courseFragment";
import { ENROLLMENT_FRAGMENT } from "./enrollmentFragment";
import { USER_PROGRAM_FRAGMENT } from "./programFragment";

export const MY_COURSES = gql`
  ${COURSE_FRAGMENT}
  ${ENROLLMENT_FRAGMENT}
  ${USER_PROGRAM_FRAGMENT}
  query MyCourses($userId: uuid!) {
    User_by_pk(id: $userId) {
      CourseEnrollments {
        ...EnrollmentFragment
        Course {
          ...CourseFragment
          CourseEnrollments {
            ...EnrollmentFragment
          }
          Program {
            ...ProgramFragment
          }
        }
      }
    }
  }
`;
