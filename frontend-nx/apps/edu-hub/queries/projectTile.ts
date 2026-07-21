import { gql } from '@apollo/client';

// Lightweight fragment for project tiles and sliders. Deliberately NOT the heavy
// ProjectFragmentDetailed: only public, anonymously-readable fields are selected
// so the tiles render logged-out. Authors are limited to accepted authors of
// published projects at the permission level (used for showcase avatars);
// mentors are visible for templates too.
export const PROJECT_TILE_FRAGMENT = gql`
  fragment ProjectTileFragment on Project {
    id
    title
    tagline
    coverImageUrl
    status
    published
    submittedAt
    acceptingParticipants
    organizationId
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
    ProjectBadges {
      id
      Badge {
        id
        title
        description
        icon
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
          shortTitle
          title
          type
          published
          lectureEnd
        }
        CourseGroups {
          CourseGroupOption {
            id
            order
          }
        }
      }
    }
  }
`;

// Home slider — all published showcase projects, ordered by recency. Used when a
// project slider selects no groups. Only published projects appear here;
// unpublished open templates stay in the in-course template carousel.
export const HOME_PROJECT_TILES_ALL = gql`
  ${PROJECT_TILE_FRAGMENT}
  query HomeProjectTilesAll($limit: Int = 24, $offset: Int = 0) {
    Project(
      where: { published: { _eq: true } }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...ProjectTileFragment
    }
  }
`;

// Home / widget — published showcase projects for a single organization
// (server-side scoping, mirrors COURSE_TILES_BY_ORGANIZATION in the course
// widget).
export const HOME_PROJECT_TILES_BY_ORGANIZATION = gql`
  ${PROJECT_TILE_FRAGMENT}
  query HomeProjectTilesByOrganization($organizationId: Int!, $limit: Int = 24, $offset: Int = 0) {
    Project(
      where: {
        organizationId: { _eq: $organizationId }
        published: { _eq: true }
      }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...ProjectTileFragment
    }
  }
`;

// Home slider — published showcase projects narrowed to the union of selected
// course groups and project groups.
export const HOME_PROJECT_TILES_BY_GROUPS = gql`
  ${PROJECT_TILE_FRAGMENT}
  query HomeProjectTilesByGroups($courseGroupIds: [Int!]!, $projectGroupIds: [Int!]!, $limit: Int = 24, $offset: Int = 0) {
    Project(
      where: {
        _and: [
          { published: { _eq: true } }
          {
            _or: [
              { ProjectCourses: { Course: { CourseGroups: { groupOptionId: { _in: $courseGroupIds } } } } }
              { ProjectGroups: { groupOptionId: { _in: $projectGroupIds } } }
            ]
          }
        ]
      }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...ProjectTileFragment
    }
  }
`;

// Minimal lookup so a course page can resolve its series before loading the
// published showcase projects from past iterations.
export const COURSE_SERIES_INFO = gql`
  query CourseSeriesInfo($id: Int!) {
    Course(where: { id: { _eq: $id } }) {
      id
      courseSeriesId
    }
  }
`;

// Course page — published showcase projects from any iteration of the same
// course series whose program lecture period has ended.
export const COURSE_PUBLISHED_PROJECT_TILES = gql`
  ${PROJECT_TILE_FRAGMENT}
  query CoursePublishedProjectTiles($courseSeriesId: Int!, $now: date!, $limit: Int = 24, $offset: Int = 0) {
    Project(
      where: {
        published: { _eq: true }
        ProjectCourses: { Course: { courseSeriesId: { _eq: $courseSeriesId }, Program: { lectureEnd: { _lt: $now } } } }
      }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...ProjectTileFragment
    }
  }
`;

// Course page — open project templates available in this specific course.
export const COURSE_TEMPLATE_PROJECT_TILES = gql`
  ${PROJECT_TILE_FRAGMENT}
  query CourseTemplateProjectTiles($courseId: Int!, $limit: Int = 24, $offset: Int = 0) {
    Project(
      where: {
        status: { _eq: PROPOSED }
        acceptingParticipants: { _eq: true }
        _not: { ProjectAuthors: { participationStatus: { _eq: ACCEPTED } } }
        ProjectCourses: { courseId: { _eq: $courseId } }
      }
      order_by: { updated_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...ProjectTileFragment
    }
  }
`;
