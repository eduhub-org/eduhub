/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAnAchievementOptionMentor
// ====================================================

export interface DeleteAnAchievementOptionMentor_delete_AchievementOptionMentor_by_pk {
  __typename: "AchievementOptionMentor";
  id: number;
}

export interface DeleteAnAchievementOptionMentor {
  /**
   * delete single row from the table: "AchievementOptionMentor"
   */
  delete_AchievementOptionMentor_by_pk: DeleteAnAchievementOptionMentor_delete_AchievementOptionMentor_by_pk | null;
}

export interface DeleteAnAchievementOptionMentorVariables {
  id: number;
}
