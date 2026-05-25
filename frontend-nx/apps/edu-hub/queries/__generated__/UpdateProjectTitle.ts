/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectTitle
// ====================================================

export interface UpdateProjectTitle_update_Project_by_pk {
  __typename: "Project";
  id: number;
  title: string;
}

export interface UpdateProjectTitle {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectTitle_update_Project_by_pk | null;
}

export interface UpdateProjectTitleVariables {
  itemId: number;
  text: string;
}
