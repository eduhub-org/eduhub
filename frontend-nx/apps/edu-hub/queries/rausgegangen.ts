import { gql } from '@apollo/client';

/**
 * The Rausgegangen listing of an event and whether its organization has the
 * feature. Only for super admins and org admins (RausgegangenListing has no
 * instructor permission).
 */
export const RAUSGEGANGEN_LISTING_FOR_COURSE = gql`
  query RausgegangenListingForCourse($courseId: Int!) {
    Course_by_pk(id: $courseId) {
      id
      published
      Program {
        id
        type
        Organization {
          id
          Features(where: { feature: { _eq: RAUSGEGANGEN } }) {
            id
          }
        }
      }
    }
    RausgegangenListing(where: { courseId: { _eq: $courseId } }) {
      id
      courseId
      enabled
      category
      tags
      published
      syncStatus
      syncError
      lastSyncedAt
      previewUrl
      publicUrl
    }
    RausgegangenEventCategory {
      value
    }
  }
`;

/** Enabled listings among the given courses (asked before unpublishing them in EduHub). */
export const ENABLED_RAUSGEGANGEN_LISTINGS = gql`
  query EnabledRausgegangenListings($courseIds: [Int!]!) {
    RausgegangenListing(where: { courseId: { _in: $courseIds }, enabled: { _eq: true } }) {
      id
      courseId
    }
  }
`;

export const INSERT_RAUSGEGANGEN_LISTING = gql`
  mutation InsertRausgegangenListing($courseId: Int!, $enabled: Boolean!) {
    insert_RausgegangenListing_one(object: { courseId: $courseId, enabled: $enabled }) {
      id
    }
  }
`;

export const UPDATE_RAUSGEGANGEN_LISTING_ENABLED = gql`
  mutation UpdateRausgegangenListingEnabled($id: Int!, $value: Boolean!) {
    update_RausgegangenListing_by_pk(pk_columns: { id: $id }, _set: { enabled: $value }) {
      id
      enabled
    }
  }
`;

/** Disables the listings of courses being unpublished in EduHub (the trigger unpublishes them there). */
export const DISABLE_RAUSGEGANGEN_LISTINGS = gql`
  mutation DisableRausgegangenListings($courseIds: [Int!]!) {
    update_RausgegangenListing(where: { courseId: { _in: $courseIds } }, _set: { enabled: false }) {
      affected_rows
    }
  }
`;

export const UPDATE_RAUSGEGANGEN_LISTING_CATEGORY = gql`
  mutation UpdateRausgegangenListingCategory($id: Int!, $value: RausgegangenEventCategory_enum!) {
    update_RausgegangenListing_by_pk(pk_columns: { id: $id }, _set: { category: $value }) {
      id
      category
    }
  }
`;

export const UPDATE_RAUSGEGANGEN_LISTING_TAGS = gql`
  mutation UpdateRausgegangenListingTags($id: Int!, $tags: jsonb!) {
    update_RausgegangenListing_by_pk(pk_columns: { id: $id }, _set: { tags: $tags }) {
      id
      tags
    }
  }
`;
