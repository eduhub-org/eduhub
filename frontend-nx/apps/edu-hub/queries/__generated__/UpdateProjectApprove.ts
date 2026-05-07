/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum, ProjectRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectApprove
// ====================================================

export interface UpdateProjectApprove_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
  rating: ProjectRating_enum | null;
  score: any | null;
}

export interface UpdateProjectApprove {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectApprove_update_Project_by_pk | null;
}

export interface UpdateProjectApproveVariables {
  itemId: number;
  score?: any | null;
}
