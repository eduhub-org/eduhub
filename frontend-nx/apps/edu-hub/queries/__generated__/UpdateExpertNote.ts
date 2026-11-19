/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateExpertNote
// ====================================================

export interface UpdateExpertNote_update_ExpertNote_by_pk {
  __typename: "ExpertNote";
  id: number;
}

export interface UpdateExpertNote {
  /**
   * update single row of the table: "ExpertNote"
   */
  update_ExpertNote_by_pk: UpdateExpertNote_update_ExpertNote_by_pk | null;
}

export interface UpdateExpertNoteVariables {
  id: number;
  text: string;
}
