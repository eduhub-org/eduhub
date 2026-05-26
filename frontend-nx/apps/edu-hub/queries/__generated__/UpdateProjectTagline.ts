/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectTagline
// ====================================================

export interface UpdateProjectTagline_update_Project_by_pk {
  __typename: "Project";
  id: number;
  tagline: string | null;
}

export interface UpdateProjectTagline {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectTagline_update_Project_by_pk | null;
}

export interface UpdateProjectTaglineVariables {
  itemId: number;
  text: string;
}
