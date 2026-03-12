/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramApplicationStart
// ====================================================

export interface UpdateProgramApplicationStart_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramApplicationStart {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramApplicationStart_update_Program_by_pk | null;
}

export interface UpdateProgramApplicationStartVariables {
  programId: number;
  applicationStart: any;
}
