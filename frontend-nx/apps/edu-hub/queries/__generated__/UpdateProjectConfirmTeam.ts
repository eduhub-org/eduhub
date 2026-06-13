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
  /**
   * FK to ProjectType.value. Required with documentationInstructionId before leaving PROPOSED (check constraint). Drives mandatory deliverables and workflow (e.g. ONLINE_COURSE template claim may insert ONGOING directly).
   */
  type: string | null;
  /**
   * FK to ProjectDocumentationInstruction.id. Must match Project.type (trigger Project_instruction_matches_type_trg). Instruction PDF describes deliverable composition; enforced uploads are only those required by the project type.
   */
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
