/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectStatus
// ====================================================

export interface UpdateProjectStatus_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
}

export interface UpdateProjectStatus {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectStatus_update_Project_by_pk | null;
}

export interface UpdateProjectStatusVariables {
  itemId: number;
  status: ProjectStatus_enum;
}
