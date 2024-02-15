/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateShortDescription
// ====================================================

export interface UpdateShortDescription_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateShortDescription {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateShortDescription_update_Course_by_pk | null;
}

export interface UpdateShortDescriptionVariables {
  itemId: number;
  text: string;
}
