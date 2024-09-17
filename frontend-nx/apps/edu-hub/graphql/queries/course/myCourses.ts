import { graphql } from '../../../types/generated';

export const MY_COURSES = graphql(`
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
`);
