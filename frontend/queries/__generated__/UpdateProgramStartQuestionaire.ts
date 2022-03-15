/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramStartQuestionaire
// ====================================================

export interface UpdateProgramStartQuestionaire_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramStartQuestionaire {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramStartQuestionaire_update_Program_by_pk | null;
}

export interface UpdateProgramStartQuestionaireVariables {
  programId: number;
  questionaire: string;
}
