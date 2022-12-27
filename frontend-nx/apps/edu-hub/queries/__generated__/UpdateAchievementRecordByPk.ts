/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecord_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAchievementRecordByPk
// ====================================================

export interface UpdateAchievementRecordByPk_update_AchievementRecord_by_pk {
  __typename: "AchievementRecord";
  id: number;
}

export interface UpdateAchievementRecordByPk {
  /**
   * update single row of the table: "AchievementRecord"
   */
  update_AchievementRecord_by_pk: UpdateAchievementRecordByPk_update_AchievementRecord_by_pk | null;
}

export interface UpdateAchievementRecordByPkVariables {
  id: number;
  setInput: AchievementRecord_set_input;
}
