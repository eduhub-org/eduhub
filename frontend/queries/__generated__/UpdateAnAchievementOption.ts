/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAnAchievementOption
// ====================================================

export interface UpdateAnAchievementOption_update_AchievementOption_by_pk {
  __typename: "AchievementOption";
  id: number;
}

export interface UpdateAnAchievementOption {
  /**
   * update single row of the table: "AchievementOption"
   */
  update_AchievementOption_by_pk: UpdateAnAchievementOption_update_AchievementOption_by_pk | null;
}

export interface UpdateAnAchievementOptionVariables {
  id: number;
  changes?: AchievementOption_set_input | null;
}
