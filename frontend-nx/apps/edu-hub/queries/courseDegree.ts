import { gql } from '@apollo/client';

export const DEGREE_COURSES = gql`
  query DegreeCourses {
    Course(where: {Program: {shortTitle: {_eq: "DEGREES"}}}) {
      id
      title
    }
  }
`;

export const COMPLETED_DEGREE_ENROLLMENTS = gql`
  query CompletedDegreeEnrollments($degreeCourseId: Int!, $userId: uuid!) {
    CourseEnrollment(where: {userId: {_eq: $userId}, Course: {CourseDegrees: {degreeCourseId: {_eq: $degreeCourseId}}}, achievementCertificateURL: {_is_null: false}}) {
      Course {
        id
        title
        ects
        Program {
          shortTitle
          title
        }
      }
    }
  }
`;

export const DEGREE_PARTICIPANTS_WITH_DEGREE_ENROLLMENTS = gql`
  query DegreeParticipantsWithDegreeEnrollments($degreeCourseId: Int!) {
    Course_by_pk(id: $degreeCourseId) {
      CourseEnrollments {
        status
        User {
          id
          firstName
          lastName
          email
        CourseEnrollments(where: {
          Course: {CourseDegrees: {degreeCourseId: {_eq: $degreeCourseId}}}
        }) {
          status
          achievementCertificateURL
          updated_at
          Course {
            id
            title
            ects
            Program {
              shortTitle
              title
            }
          }
        }
        }
      }
    }
  }
`;

export const INSERT_COURSE_DEGREE_TAG = gql`
  mutation InsertCourseDegreeTag($itemId: Int!, $tagId: Int!) {
    insert_CourseDegree(
      objects: { courseId: $itemId, degreeCourseId: $tagId }
    ) {
      affected_rows
    }
  }
`;

export const DELETE_COURSE_DEGREE_TAG = gql`
  mutation DeleteCourseDegreeTag($itemId: Int!, $tagId: Int!) {
    delete_CourseDegree(
      where: {
        Course: { id: { _eq: $itemId } }
        _and: { DegreeCourse: { id: { _eq: $tagId } } }
      }
    ) {
      affected_rows
    }
  }
`;
