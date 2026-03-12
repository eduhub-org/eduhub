/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateProgramAchievementTemplate
// ====================================================

export interface UpdateProgramAchievementTemplate_update_Program_by_pk {
  __typename: "Program";
  id: number;
}

export interface UpdateProgramAchievementTemplate {
  /**
   * update single row of the table: "Program"
   */
  update_Program_by_pk: UpdateProgramAchievementTemplate_update_Program_by_pk | null;
}

export interface UpdateProgramAchievementTemplateVariables {
  programId: number;
  templatePath: string;
}
