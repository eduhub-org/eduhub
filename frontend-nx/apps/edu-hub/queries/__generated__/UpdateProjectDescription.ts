/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDescription
// ====================================================

export interface UpdateProjectDescription_update_Project_by_pk {
  __typename: "Project";
  id: number;
  description: string | null;
}

export interface UpdateProjectDescription {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectDescription_update_Project_by_pk | null;
}

export interface UpdateProjectDescriptionVariables {
  itemId: number;
  text: string;
}
