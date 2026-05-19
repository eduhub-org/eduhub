/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProject
// ====================================================

export interface DeleteProject_delete_Project_by_pk {
  __typename: "Project";
  id: number;
}

export interface DeleteProject {
  /**
   * delete single row from the table: "Project"
   */
  delete_Project_by_pk: DeleteProject_delete_Project_by_pk | null;
}

export interface DeleteProjectVariables {
  id: number;
}
