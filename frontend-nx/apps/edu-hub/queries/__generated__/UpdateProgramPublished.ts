/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramPublished
// ====================================================

export interface UpdateProgramPublished_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramPublished {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramPublished_update_Program_by_pk | null;
}

export interface UpdateProgramPublishedVariables {
  programId: number;
  published: boolean;
}
