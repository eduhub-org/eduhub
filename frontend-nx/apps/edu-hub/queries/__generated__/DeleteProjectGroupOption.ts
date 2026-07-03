/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectGroupOption
// ====================================================

export interface DeleteProjectGroupOption_delete_ProjectGroupOption_by_pk {
  __typename: "ProjectGroupOption";
  id: number;
}

export interface DeleteProjectGroupOption {
  /**
   * delete single row from the table: "ProjectGroupOption"
   */
  delete_ProjectGroupOption_by_pk: DeleteProjectGroupOption_delete_ProjectGroupOption_by_pk | null;
}

export interface DeleteProjectGroupOptionVariables {
  id: number;
}
