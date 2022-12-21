/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecord_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAnAchievementRecord
// ====================================================

export interface InsertAnAchievementRecord_insert_AchievementRecord_one {
  __typename: "AchievementRecord";
  id: number;
}

export interface InsertAnAchievementRecord {
  /**
   * insert a single row into the table: "AchievementRecord"
   */
  insert_AchievementRecord_one: InsertAnAchievementRecord_insert_AchievementRecord_one | null;
}

export interface InsertAnAchievementRecordVariables {
  insertInput: AchievementRecord_insert_input;
}
