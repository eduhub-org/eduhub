/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramTitle
// ====================================================

export interface UpdateProgramTitle_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramTitle {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramTitle_update_Program_by_pk | null;
}

export interface UpdateProgramTitleVariables {
  programId: number;
  title: string;
}
