/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAchievementRecordAuthorByPk
// ====================================================

export interface DeleteAchievementRecordAuthorByPk_delete_AchievementRecordAuthor_by_pk {
  __typename: "AchievementRecordAuthor";
  id: number;
}

export interface DeleteAchievementRecordAuthorByPk {
  /**
   * delete single row from the table: "AchievementRecordAuthor"
   */
  delete_AchievementRecordAuthor_by_pk: DeleteAchievementRecordAuthorByPk_delete_AchievementRecordAuthor_by_pk | null;
}

export interface DeleteAchievementRecordAuthorByPkVariables {
  id: number;
}
