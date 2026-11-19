/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteExpertNote
// ====================================================

export interface DeleteExpertNote_delete_ExpertNote_by_pk {
  __typename: "ExpertNote";
  id: number;
}

export interface DeleteExpertNote {
  /**
   * delete single row from the table: "ExpertNote"
   */
  delete_ExpertNote_by_pk: DeleteExpertNote_delete_ExpertNote_by_pk | null;
}

export interface DeleteExpertNoteVariables {
  id: number;
}
