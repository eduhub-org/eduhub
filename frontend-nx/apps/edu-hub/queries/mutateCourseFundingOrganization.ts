import { gql } from "@apollo/client";

export const INSERT_COURSE_FUNDING_ORGANIZATION = gql`
  mutation InsertCourseFundingOrganization($courseId: Int!, $organizationId: Int!) {
    insert_CourseFundingOrganization(
      objects: { courseId: $courseId, organizationId: $organizationId }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const DELETE_COURSE_FUNDING_ORGANIZATION = gql`
  mutation DeleteCourseFundingOrganization($courseId: Int!, $organizationId: Int!) {
    delete_CourseFundingOrganization(
      where: {
        _and: [
          { courseId: { _eq: $courseId } }
          { organizationId: { _eq: $organizationId } }
        ]
      }
    ) {
      affected_rows
    }
  }
`;

export const COURSE_FUNDING_ORGANIZATIONS_BY_ORGANIZATION_ID = gql`
  query CourseFundingOrganizationsByOrganizationId($organizationIds: [Int!]!) {
    CourseFundingOrganization(where: { organizationId: { _in: $organizationIds } }) {
      id
      organizationId
      courseId
      Course {
        id
        title
      }
    }
  }
`; 