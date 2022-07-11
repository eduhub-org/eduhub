/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramAchievementCertVisible
// ====================================================

export interface UpdateProgramAchievementCertVisible_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramAchievementCertVisible {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramAchievementCertVisible_update_Program_by_pk | null;
}

export interface UpdateProgramAchievementCertVisibleVariables {
  programId: number;
  isVisible: boolean;
}
