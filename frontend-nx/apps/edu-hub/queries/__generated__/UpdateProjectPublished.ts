/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectPublished
// ====================================================

export interface UpdateProjectPublished_update_Project_by_pk {
  __typename: "Project";
  id: number;
  /**
   * Showcase visibility flag: true means the project is publicly published (home sliders, public showcase). Orthogonal to lifecycle, which stays in "status".
   */
  published: boolean;
  /**
   * Course staff flag: a completed project is suggested for showcase publication. Toggling this does not publish the project (status PUBLISHED is set separately).
   */
  suggestedForPublication: boolean;
}

export interface UpdateProjectPublished {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectPublished_update_Project_by_pk | null;
}

export interface UpdateProjectPublishedVariables {
  itemId: number;
  published: boolean;
  suggestedForPublication: boolean;
}
