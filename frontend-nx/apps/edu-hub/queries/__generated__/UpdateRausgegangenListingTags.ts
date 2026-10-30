/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateRausgegangenListingTags
// ====================================================

export interface UpdateRausgegangenListingTags_update_RausgegangenListing_by_pk {
  __typename: "RausgegangenListing";
  id: number;
  tags: any;
}

export interface UpdateRausgegangenListingTags {
  /**
   * update single row of the table: "RausgegangenListing"
   */
  update_RausgegangenListing_by_pk: UpdateRausgegangenListingTags_update_RausgegangenListing_by_pk | null;
}

export interface UpdateRausgegangenListingTagsVariables {
  id: number;
  tags: any;
}
