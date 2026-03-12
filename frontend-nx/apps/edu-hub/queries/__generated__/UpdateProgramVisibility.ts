/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramVisibility
// ====================================================

export interface UpdateProgramVisibility_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramVisibility {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramVisibility_update_Program_by_pk | null;
}

export interface UpdateProgramVisibilityVariables {
  programId: number;
  visible: boolean;
}
