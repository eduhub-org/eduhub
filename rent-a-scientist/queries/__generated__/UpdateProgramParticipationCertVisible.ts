/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramParticipationCertVisible
// ====================================================

export interface UpdateProgramParticipationCertVisible_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramParticipationCertVisible {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramParticipationCertVisible_update_Program_by_pk | null;
}

export interface UpdateProgramParticipationCertVisibleVariables {
  programId: number;
  isVisible: boolean;
}
