/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramApplicationEnd
// ====================================================

export interface UpdateProgramApplicationEnd_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramApplicationEnd {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramApplicationEnd_update_Program_by_pk | null;
}

export interface UpdateProgramApplicationEndVariables {
  programId: number;
  applicationEnd: any;
}
