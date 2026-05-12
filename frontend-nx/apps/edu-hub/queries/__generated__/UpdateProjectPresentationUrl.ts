/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectPresentationUrl
// ====================================================

export interface UpdateProjectPresentationUrl_update_Project_by_pk {
  __typename: "Project";
  id: number;
  presentationUrl: string | null;
}

export interface UpdateProjectPresentationUrl {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectPresentationUrl_update_Project_by_pk | null;
}

export interface UpdateProjectPresentationUrlVariables {
  itemId: number;
  text?: string | null;
}
