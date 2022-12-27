/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionCourse_set_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateAnAchievementOptionCourse
// ====================================================

export interface UpdateAnAchievementOptionCourse_update_AchievementOptionCourse_by_pk {
  __typename: "AchievementOptionCourse";
  id: number;
}

export interface UpdateAnAchievementOptionCourse {
  /**
   * update single row of the table: "AchievementOptionCourse"
   */
  update_AchievementOptionCourse_by_pk: UpdateAnAchievementOptionCourse_update_AchievementOptionCourse_by_pk | null;
}

export interface UpdateAnAchievementOptionCourseVariables {
  id: number;
  changes?: AchievementOptionCourse_set_input | null;
}
