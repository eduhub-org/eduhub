/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: FaqCollections
// ====================================================

export interface FaqCollections_FaqCollection {
  __typename: "FaqCollection";
  id: number;
  name: string;
}

export interface FaqCollections {
  /**
   * fetch data from the table: "FaqCollection"
   */
  FaqCollection: FaqCollections_FaqCollection[];
}
