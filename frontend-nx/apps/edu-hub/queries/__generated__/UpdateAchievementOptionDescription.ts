/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAchievementOptionDescription
// ====================================================

export interface UpdateAchievementOptionDescription_update_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface UpdateAchievementOptionDescription {
  /**
   * update single row of the table: "AchievementOption"
   */
  update_AchievementOption_by_pk: UpdateAchievementOptionDescription_update_AchievementOption_by_pk | null;
}

export interface UpdateAchievementOptionDescriptionVariables {
  itemId: number;
  text: string;
}
