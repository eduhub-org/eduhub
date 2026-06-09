import { gql } from "@apollo/client";
import { COURSE_TILE_FRAGMENT } from "./courseFragements";

export const COURSE_TILES = gql`
  ${COURSE_TILE_FRAGMENT}
  query CourseTiles {
    Course(
      order_by: { updated_at: desc }
      where: { published: { _eq: true }, Program: { published: { _eq: true } } }
    ) {
      ...CourseTileFragment
      Program {
        type
      }
      CourseGroups {
        CourseGroupOption {
          id
          order
          title
        }
      }
    }
  }
`;

export const COURSE_TILES_BY_ORGANIZATION = gql`
  ${COURSE_TILE_FRAGMENT}
  query CourseTilesByOrganization($organizationId: Int!) {
    Course(
      order_by: { updated_at: desc }
      where: {
        published: { _eq: true }
        Program: { published: { _eq: true } }
        CourseFundingOrganizations: {
          organizationId: { _eq: $organizationId }
        }
      }
    ) {
      ...CourseTileFragment
      Program {
        type
      }
      CourseGroups {
        CourseGroupOption {
          id
          order
          title
        }
      }
    }
  }
`;

export const COURSES_BY_INSTRUCTOR = gql`
  ${COURSE_TILE_FRAGMENT}
  query CoursesByInstructor($userId: uuid!) {
    Course(
      order_by: { applicationEnd: desc }
      where: {
        CourseInstructors: {
          User: {
            id: { _eq: $userId }
          }
        }
      }
    ) {
      ...CourseTileFragment
    }
  }
`;

export const COURSES_ENROLLED_BY_USER = gql`
  ${COURSE_TILE_FRAGMENT}
  query CoursesEnrolledByUser($userId: uuid!) {
    Course(
      order_by: { applicationEnd: desc }
      where: {
        CourseEnrollments: {
          userId: { _eq: $userId }
        }
      }
    ) {
      ...CourseTileFragment
    }
  }
`;
