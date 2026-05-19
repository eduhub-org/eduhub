/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectConfirmTeam
// ====================================================

export interface UpdateProjectConfirmTeam_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
  type: string | null;
  documentationInstructionId: number | null;
}

export interface UpdateProjectConfirmTeam {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectConfirmTeam_update_Project_by_pk | null;
}

export interface UpdateProjectConfirmTeamVariables {
  itemId: number;
  type: string;
  documentationInstructionId: number;
}
