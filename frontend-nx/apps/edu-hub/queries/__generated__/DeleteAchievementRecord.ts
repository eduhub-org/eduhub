/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteAchievementRecord
// ====================================================

export interface DeleteAchievementRecord_delete_AchievementRecord_by_pk {
  __typename: "AchievementRecord";
  id: number;
}

export interface DeleteAchievementRecord {
  /**
   * delete single row from the table: "AchievementRecord"
   */
  delete_AchievementRecord_by_pk: DeleteAchievementRecord_delete_AchievementRecord_by_pk | null;
}

export interface DeleteAchievementRecordVariables {
  id: number;
}
