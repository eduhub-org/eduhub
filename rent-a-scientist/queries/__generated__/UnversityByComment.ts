/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: UnversityByComment
// ====================================================

export interface UnversityByComment_University {
  __typename: "University";
  value: string;
  comment: string;
}

export interface UnversityByComment {
  /**
   * fetch data from the table: "University"
   */
  University: UnversityByComment_University[];
}
