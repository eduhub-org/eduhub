/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum, ProjectRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectReject
// ====================================================

export interface UpdateProjectReject_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
  rating: ProjectRating_enum | null;
}

export interface UpdateProjectReject {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectReject_update_Project_by_pk | null;
}

export interface UpdateProjectRejectVariables {
  itemId: number;
}
