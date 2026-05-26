/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectCoverImageUrl
// ====================================================

export interface UpdateProjectCoverImageUrl_update_Project_by_pk {
  __typename: "Project";
  id: number;
  coverImageUrl: string | null;
}

export interface UpdateProjectCoverImageUrl {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectCoverImageUrl_update_Project_by_pk | null;
}

export interface UpdateProjectCoverImageUrlVariables {
  itemId: number;
  text?: string | null;
}
