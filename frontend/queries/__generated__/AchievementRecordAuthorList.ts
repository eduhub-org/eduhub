/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecordAuthor_bool_exp, AchievementRecordAuthor_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementRecordAuthorList
// ====================================================

export interface AchievementRecordAuthorList_AchievementRecordAuthor_User {
  __typename: "User";
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's first name
   */
  firstName: string;
}

export interface AchievementRecordAuthorList_AchievementRecordAuthor {
  __typename: "AchievementRecordAuthor";
  id: number;
  created_at: any;
  /**
   * An object relationship
   */
  User: AchievementRecordAuthorList_AchievementRecordAuthor_User;
}

export interface AchievementRecordAuthorList {
  /**
   * fetch data from the table: "AchievementRecordAuthor"
   */
  AchievementRecordAuthor: AchievementRecordAuthorList_AchievementRecordAuthor[];
}

export interface AchievementRecordAuthorListVariables {
  where: AchievementRecordAuthor_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementRecordAuthor_order_by | null;
}
