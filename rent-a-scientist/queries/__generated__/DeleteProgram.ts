/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteProgram
// ====================================================

export interface DeleteProgram_delete_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface DeleteProgram {
  /**
   * delete single row from the table: "Program"
   */
  delete_Program_by_pk: DeleteProgram_delete_Program_by_pk | null;
}

export interface DeleteProgramVariables {
  programId: number;
}
