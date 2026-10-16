/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramPublishedValue
// ====================================================

export interface UpdateProgramPublishedValue_update_Program_by_pk {
  __typename: "Program";
  id: number;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface UpdateProgramPublishedValue {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramPublishedValue_update_Program_by_pk | null;
}

export interface UpdateProgramPublishedValueVariables {
  programId: number;
  value: boolean;
}
