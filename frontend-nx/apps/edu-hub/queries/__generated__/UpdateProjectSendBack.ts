/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectSendBack
// ====================================================

export interface UpdateProjectSendBack_update_Project_by_pk {
  __typename: "Project";
  id: number;
  status: ProjectStatus_enum;
  /**
   * Timestamp at which the project most recently transitioned to SUBMITTED. Cleared when a reviewer sends the project back to ONGOING so the student-side "sent back for revisions" banner remains accurate.
   */
  submittedAt: any | null;
  /**
   * User who issued the most recent SUBMITTED transition. Set via a Hasura permission preset (x-hasura-user-id) so the client cannot impersonate another author.
   */
  submittedBy: any | null;
}

export interface UpdateProjectSendBack {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectSendBack_update_Project_by_pk | null;
}

export interface UpdateProjectSendBackVariables {
  itemId: number;
}
