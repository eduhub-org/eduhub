/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectSuggestedForPublication
// ====================================================

export interface UpdateProjectSuggestedForPublication_update_Project_by_pk {
  __typename: "Project";
  id: number;
  /**
   * Course staff flag: a completed project is suggested for showcase publication. Toggling this does not publish the project (status PUBLISHED is set separately).
   */
  suggestedForPublication: boolean;
}

export interface UpdateProjectSuggestedForPublication {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectSuggestedForPublication_update_Project_by_pk | null;
}

export interface UpdateProjectSuggestedForPublicationVariables {
  itemId: number;
  suggested: boolean;
}
