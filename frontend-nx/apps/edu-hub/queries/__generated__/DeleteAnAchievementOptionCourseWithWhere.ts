/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionCourse_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: DeleteAnAchievementOptionCourseWithWhere
// ====================================================

export interface DeleteAnAchievementOptionCourseWithWhere_delete_AchievementOptionCourse {
  __typename: "AchievementOptionCourse_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteAnAchievementOptionCourseWithWhere {
  /**
   * delete data from the table: "AchievementOptionCourse"
   */
  delete_AchievementOptionCourse: DeleteAnAchievementOptionCourseWithWhere_delete_AchievementOptionCourse | null;
}

export interface DeleteAnAchievementOptionCourseWithWhereVariables {
  where: AchievementOptionCourse_bool_exp;
}
