/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecordAuthor_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAnAchievementRecordAuthor
// ====================================================

export interface InsertAnAchievementRecordAuthor_insert_AchievementRecordAuthor_one {
  __typename: "AchievementRecordAuthor";
  id: number;
}

export interface InsertAnAchievementRecordAuthor {
  /**
   * insert a single row into the table: "AchievementRecordAuthor"
   */
  insert_AchievementRecordAuthor_one: InsertAnAchievementRecordAuthor_insert_AchievementRecordAuthor_one | null;
}

export interface InsertAnAchievementRecordAuthorVariables {
  insertInput: AchievementRecordAuthor_insert_input;
}
