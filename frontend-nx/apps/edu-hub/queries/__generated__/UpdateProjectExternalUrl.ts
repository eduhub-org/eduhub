/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectExternalUrl
// ====================================================

export interface UpdateProjectExternalUrl_update_Project_by_pk {
  __typename: "Project";
  id: number;
  externalUrl: string | null;
}

export interface UpdateProjectExternalUrl {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectExternalUrl_update_Project_by_pk | null;
}

export interface UpdateProjectExternalUrlVariables {
  itemId: number;
  text: string;
}
