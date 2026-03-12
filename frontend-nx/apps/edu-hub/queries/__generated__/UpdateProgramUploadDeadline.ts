/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramUploadDeadline
// ====================================================

export interface UpdateProgramUploadDeadline_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramUploadDeadline {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramUploadDeadline_update_Program_by_pk | null;
}

export interface UpdateProgramUploadDeadlineVariables {
  programId: number;
  deadline: any;
}
