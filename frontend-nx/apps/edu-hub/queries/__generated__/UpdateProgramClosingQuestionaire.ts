/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramClosingQuestionaire
// ====================================================

export interface UpdateProgramClosingQuestionaire_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramClosingQuestionaire {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramClosingQuestionaire_update_Program_by_pk | null;
}

export interface UpdateProgramClosingQuestionaireVariables {
  programId: number;
  questionaire: string;
}
