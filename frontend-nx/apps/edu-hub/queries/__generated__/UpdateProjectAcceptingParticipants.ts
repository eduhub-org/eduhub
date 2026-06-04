/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProjectAcceptingParticipants
// ====================================================

export interface UpdateProjectAcceptingParticipants_update_Project_by_pk {
  __typename: "Project";
  id: number;
  acceptingParticipants: boolean;
}

export interface UpdateProjectAcceptingParticipants {
  /**
   * update single row of the table: "Project"
   */
  update_Project_by_pk: UpdateProjectAcceptingParticipants_update_Project_by_pk | null;
}

export interface UpdateProjectAcceptingParticipantsVariables {
  itemId: number;
  value: boolean;
}
