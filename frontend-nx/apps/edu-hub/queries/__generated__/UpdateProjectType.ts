/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectType
// ====================================================

export interface UpdateProjectType_update_Project_by_pk {
  __typename: "Project";
  id: number;
  type: string | null;
}

export interface UpdateProjectType {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectType_update_Project_by_pk | null;
}

export interface UpdateProjectTypeVariables {
  itemId: number;
  value?: string | null;
}
