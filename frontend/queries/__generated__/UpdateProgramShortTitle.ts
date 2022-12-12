/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramShortTitle
// ====================================================

export interface UpdateProgramShortTitle_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramShortTitle {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramShortTitle_update_Program_by_pk | null;
}

export interface UpdateProgramShortTitleVariables {
  programId: number;
  shortTitle: string;
}
