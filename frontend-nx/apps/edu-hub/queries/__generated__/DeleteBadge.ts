/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteBadge
// ====================================================

export interface DeleteBadge_delete_Badge_by_pk {
  __typename: "Badge";
  id: number;
}

export interface DeleteBadge {
  /**
   * delete single row from the table: "Badge"
   */
  delete_Badge_by_pk: DeleteBadge_delete_Badge_by_pk | null;
}

export interface DeleteBadgeVariables {
  id: number;
}
