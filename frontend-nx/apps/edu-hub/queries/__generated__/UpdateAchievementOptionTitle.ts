/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateAchievementOptionTitle
// ====================================================

export interface UpdateAchievementOptionTitle_update_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface UpdateAchievementOptionTitle {
  /**
   * update single row of the table: "AchievementOption"
   */
  update_AchievementOption_by_pk: UpdateAchievementOptionTitle_update_AchievementOption_by_pk | null;
}

export interface UpdateAchievementOptionTitleVariables {
  itemId: number;
  text: string;
}
