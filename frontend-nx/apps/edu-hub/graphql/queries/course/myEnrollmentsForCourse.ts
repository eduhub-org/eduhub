import { graphql } from '../../../types/generated';

export const MY_ENROLLMENTS_FOR_COURSE = graphql(`
  query MyEnrollmentsForCourseQuery($courseId: Int!) {
    CourseEnrollment(where: { courseId: { _eq: $courseId } }) {
      ...EnrollmentFragment
      Course {
        ...CourseFragment
      }
    }
  }
`);
