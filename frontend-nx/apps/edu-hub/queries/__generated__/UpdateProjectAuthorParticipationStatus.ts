/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ProjectParticipationStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateProjectAuthorParticipationStatus
// ====================================================

export interface UpdateProjectAuthorParticipationStatus_update_ProjectAuthor_by_pk {
  __typename: "ProjectAuthor";
  id: number;
  participationStatus: ProjectParticipationStatus_enum;
}

export interface UpdateProjectAuthorParticipationStatus {
  /**
   * update single row of the table: "ProjectAuthor"
   */
  update_ProjectAuthor_by_pk: UpdateProjectAuthorParticipationStatus_update_ProjectAuthor_by_pk | null;
}

export interface UpdateProjectAuthorParticipationStatusVariables {
  id: number;
  value: ProjectParticipationStatus_enum;
}
