/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAnAchievementOption
// ====================================================

export interface DeleteAnAchievementOption_delete_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface DeleteAnAchievementOption {
  /**
   * delete single row from the table: "AchievementOption"
   */
  delete_AchievementOption_by_pk: DeleteAnAchievementOption_delete_AchievementOption_by_pk | null;
}

export interface DeleteAnAchievementOptionVariables {
  id: number;
}
