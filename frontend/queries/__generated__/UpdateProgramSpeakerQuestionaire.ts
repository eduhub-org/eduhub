/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramSpeakerQuestionaire
// ====================================================

export interface UpdateProgramSpeakerQuestionaire_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramSpeakerQuestionaire {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramSpeakerQuestionaire_update_Program_by_pk | null;
}

export interface UpdateProgramSpeakerQuestionaireVariables {
  programId: number;
  questionaire: string;
}
