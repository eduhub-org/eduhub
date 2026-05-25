/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProjectAuthor
// ====================================================

export interface DeleteProjectAuthor_delete_ProjectAuthor_by_pk {
  __typename: "ProjectAuthor";
  id: number;
}

export interface DeleteProjectAuthor {
  /**
   * delete single row from the table: "ProjectAuthor"
   */
  delete_ProjectAuthor_by_pk: DeleteProjectAuthor_delete_ProjectAuthor_by_pk | null;
}

export interface DeleteProjectAuthorVariables {
  id: number;
}
