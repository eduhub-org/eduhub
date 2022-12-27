/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecord_bool_exp, AchievementRecord_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementRecordList
// ====================================================

export interface AchievementRecordList_AchievementRecord_AchievementRecordAuthors {
  __typename: "AchievementRecordAuthor";
  id: number;
  /**
   * ID of a user that is author of an uploaded achievement record
   */
  userId: any;
}

export interface AchievementRecordList_AchievementRecord {
  __typename: "AchievementRecord";
  id: number;
  /**
   * ID of the user who uploaded the record
   */
  uploadUserId: any;
  /**
   * An array relationship
   */
  AchievementRecordAuthors: AchievementRecordList_AchievementRecord_AchievementRecordAuthors[];
  created_at: any | null;
}

export interface AchievementRecordList {
  /**
   * fetch data from the table: "AchievementRecord"
   */
  AchievementRecord: AchievementRecordList_AchievementRecord[];
}

export interface AchievementRecordListVariables {
  where: AchievementRecord_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementRecord_order_by | null;
}
