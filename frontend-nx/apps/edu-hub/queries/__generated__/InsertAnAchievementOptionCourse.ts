/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionCourse_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAnAchievementOptionCourse
// ====================================================

export interface InsertAnAchievementOptionCourse_insert_AchievementOptionCourse_one {
  __typename: "AchievementOptionCourse";
  id: number;
}

export interface InsertAnAchievementOptionCourse {
  /**
   * insert a single row into the table: "AchievementOptionCourse"
   */
  insert_AchievementOptionCourse_one: InsertAnAchievementOptionCourse_insert_AchievementOptionCourse_one | null;
}

export interface InsertAnAchievementOptionCourseVariables {
  data: AchievementOptionCourse_insert_input;
}
