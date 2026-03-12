/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOption_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAnAchievementOption
// ====================================================

export interface InsertAnAchievementOption_insert_AchievementOption_one {
  __typename: "AchievementOption";
  id: number;
}

export interface InsertAnAchievementOption {
  /**
   * insert a single row into the table: "AchievementOption"
   */
  insert_AchievementOption_one: InsertAnAchievementOption_insert_AchievementOption_one | null;
}

export interface InsertAnAchievementOptionVariables {
  data: AchievementOption_insert_input;
}
