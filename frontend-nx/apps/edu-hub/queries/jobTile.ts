import { gql } from '@apollo/client';

// Lightweight fragment for job tiles and sliders. Only public, anonymously-
// readable fields of a Stujo job posting are selected so the tiles render
// logged-out. Restricted postings never appear and publish/expiry filtering is
// enforced by the Hasura anonymous select permission (see
// backend/metadata/.../public_JobPosting.yaml), not by these queries.
export const JOB_TILE_FRAGMENT = gql`
  fragment JobTileFragment on JobPosting {
    id
    title
    type
    occupation
    location
    region
    featured
    publishedAt
    Organization {
      id
      name
      logo
    }
  }
`;

// Home slider — all published job postings, ordered featured-first then newest.
// Used when a job slider selects no job types.
export const HOME_JOB_TILES_ALL = gql`
  ${JOB_TILE_FRAGMENT}
  query HomeJobTilesAll($limit: Int = 24, $offset: Int = 0) {
    JobPosting(order_by: [{ featured: desc }, { publishedAt: desc }], limit: $limit, offset: $offset) {
      ...JobTileFragment
    }
  }
`;

// Home slider — published job postings narrowed to the selected job types.
export const HOME_JOB_TILES_BY_TYPES = gql`
  ${JOB_TILE_FRAGMENT}
  query HomeJobTilesByTypes($types: [JobPostingType_enum!]!, $limit: Int = 24, $offset: Int = 0) {
    JobPosting(
      where: { type: { _in: $types } }
      order_by: [{ featured: desc }, { publishedAt: desc }]
      limit: $limit
      offset: $offset
    ) {
      ...JobTileFragment
    }
  }
`;

// Home / widget — published job postings for a single organization (server-side
// scoping, mirrors HOME_PROJECT_TILES_BY_ORGANIZATION in the project widget).
export const HOME_JOB_TILES_BY_ORGANIZATION = gql`
  ${JOB_TILE_FRAGMENT}
  query HomeJobTilesByOrganization($organizationId: Int!, $limit: Int = 24, $offset: Int = 0) {
    JobPosting(
      where: { organizationId: { _eq: $organizationId } }
      order_by: [{ featured: desc }, { publishedAt: desc }]
      limit: $limit
      offset: $offset
    ) {
      ...JobTileFragment
    }
  }
`;
