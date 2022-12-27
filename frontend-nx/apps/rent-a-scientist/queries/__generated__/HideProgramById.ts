/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: HideProgramById
// ====================================================

export interface HideProgramById_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface HideProgramById {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: HideProgramById_update_Program_by_pk | null;
}

export interface HideProgramByIdVariables {
  id: number;
}
