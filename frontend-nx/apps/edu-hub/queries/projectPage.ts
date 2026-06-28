import { gql } from '@apollo/client';

import { PROJECT_TILE_FRAGMENT } from './projectTile';

// Public, anonymously-readable project detail used by the public project pages.
// Like ProjectTileFragment it avoids fields that are not exposed to anonymous
// (rating, proposedByUserId, csvResults, …) so the pages render logged-out.
export const PROJECT_PAGE_FRAGMENT = gql`
  fragment ProjectPageFragment on Project {
    id
    title
    tagline
    description
    coverImageUrl
    status
    type
    acceptingParticipants
    organizationId
    documentationUrl
    presentationUrl
    externalUrl
    submissionDeadline
    Organization {
      id
      name
    }
    ProjectMentors {
      id
      User {
        id
        firstName
        lastName
        picture
      }
    }
    ProjectAuthors {
      id
      User {
        id
        firstName
        lastName
        picture
      }
    }
    ProjectCourses {
      id
      courseId
      Course {
        id
        title
        applicationEnd
        Program {
          id
          title
          shortTitle
          type
          published
          lectureStart
          lectureEnd
          applicationStart
          defaultApplicationEnd
        }
        CourseGroups {
          id
          groupOptionId
        }
      }
    }
  }
`;

export const PROJECT_PAGE = gql`
  ${PROJECT_PAGE_FRAGMENT}
  query ProjectPage($id: Int!) {
    Project(where: { id: { _eq: $id } }) {
      ...ProjectPageFragment
    }
  }
`;

// "Similar projects": published projects that share a course group with the
// current project, excluding the project itself.
export const SIMILAR_PROJECT_TILES = gql`
  ${PROJECT_TILE_FRAGMENT}
  query SimilarProjectTiles($excludeId: Int!, $courseGroupIds: [Int!]!) {
    Project(
      where: {
        id: { _neq: $excludeId }
        status: { _eq: PUBLISHED }
        ProjectCourses: { Course: { CourseGroups: { groupOptionId: { _in: $courseGroupIds } } } }
      }
      order_by: { updated_at: desc }
      limit: 12
    ) {
      ...ProjectTileFragment
    }
  }
`;
