/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionMentor_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAnAchievementOptionMentor
// ====================================================

export interface InsertAnAchievementOptionMentor_insert_AchievementOptionMentor_one {
  __typename: "AchievementOptionMentor";
  id: number;
}

export interface InsertAnAchievementOptionMentor {
  /**
   * insert a single row into the table: "AchievementOptionMentor"
   */
  insert_AchievementOptionMentor_one: InsertAnAchievementOptionMentor_insert_AchievementOptionMentor_one | null;
}

export interface InsertAnAchievementOptionMentorVariables {
  data: AchievementOptionMentor_insert_input;
}
