/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertRausgegangenListing
// ====================================================

export interface InsertRausgegangenListing_insert_RausgegangenListing_one {
  __typename: "RausgegangenListing";
  id: number;
}

export interface InsertRausgegangenListing {
  /**
   * insert a single row into the table: "RausgegangenListing"
   */
  insert_RausgegangenListing_one: InsertRausgegangenListing_insert_RausgegangenListing_one | null;
}

export interface InsertRausgegangenListingVariables {
  courseId: number;
  enabled: boolean;
}
