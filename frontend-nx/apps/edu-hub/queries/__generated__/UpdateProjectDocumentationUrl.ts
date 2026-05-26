/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectDocumentationUrl
// ====================================================

export interface UpdateProjectDocumentationUrl_update_Project_by_pk {
  __typename: "Project";
  id: number;
  documentationUrl: string | null;
}

export interface UpdateProjectDocumentationUrl {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectDocumentationUrl_update_Project_by_pk | null;
}

export interface UpdateProjectDocumentationUrlVariables {
  itemId: number;
  text?: string | null;
}
