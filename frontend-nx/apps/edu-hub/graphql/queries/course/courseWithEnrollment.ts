import { graphql } from '../../../types/generated';

export const COURSE_WITH_ENROLLMENT = graphql(`
  query CourseWithEnrollment($id: Int!, $userId: uuid!) {
    Course_by_pk(id: $id) {
      ...CourseFragment
      chatLink
      # LinkVideoCall
      CourseEnrollments {
        ...EnrollmentFragment
      }
      CourseLocations {
        id
        locationOption
        defaultSessionAddress
      }
      Program {
        ...ProgramFragment
      }
      Sessions(order_by: { startDateTime: asc }) {
        ...SessionFragment
        Attendances(where: { User: { id: { _eq: $userId } } }) {
          id
          status
          updated_at
        }
      }
    }
  }
`);
