/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAnAchievementOptionCourse
// ====================================================

export interface DeleteAnAchievementOptionCourse_delete_AchievementOptionCourse_by_pk {
  __typename: "AchievementOptionCourse";
  id: number;
}

export interface DeleteAnAchievementOptionCourse {
  /**
   * delete single row from the table: "AchievementOptionCourse"
   */
  delete_AchievementOptionCourse_by_pk: DeleteAnAchievementOptionCourse_delete_AchievementOptionCourse_by_pk | null;
}

export interface DeleteAnAchievementOptionCourseVariables {
  id: number;
}
