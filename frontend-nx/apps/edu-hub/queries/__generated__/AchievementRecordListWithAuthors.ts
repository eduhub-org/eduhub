/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecord_bool_exp, AchievementRecord_order_by, AchievementRecordRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementRecordListWithAuthors
// ====================================================

export interface AchievementRecordListWithAuthors_AchievementRecord_AchievementRecordAuthors_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
}

export interface AchievementRecordListWithAuthors_AchievementRecord_AchievementRecordAuthors {
  __typename: "AchievementRecordAuthor";
  id: number;
  created_at: any;
  /**
   * An object relationship
   */
  User: AchievementRecordListWithAuthors_AchievementRecord_AchievementRecordAuthors_User;
}

export interface AchievementRecordListWithAuthors_AchievementRecord {
  __typename: "AchievementRecord";
  id: number;
  created_at: any | null;
  /**
   * Base64 encoded string of the uploaded csv data
   */
  csvResults: string | null;
  /**
   * Description that will be used in the project gallery
   */
  description: string | null;
  /**
   * ID of hte achievement option the record is uploaded for.
   */
  achievementOptionId: number;
  /**
   * ID of the user who uploaded the record
   */
  uploadUserId: any;
  /**
   * Image that will be used for the project gallery
   */
  coverImageUrl: string | null;
  /**
   * Score calculated for possibly uploaded csv data.
   */
  score: any | null;
  /**
   * The course instructor's or mentor's rating for the achievement record
   */
  rating: AchievementRecordRating_enum;
  /**
   * URL to the uploaded file with the documentation of the record.
   */
  documentationUrl: string | null;
  /**
   * An array relationship
   */
  AchievementRecordAuthors: AchievementRecordListWithAuthors_AchievementRecord_AchievementRecordAuthors[];
}

export interface AchievementRecordListWithAuthors {
  /**
   * fetch data from the table: "AchievementRecord"
   */
  AchievementRecord: AchievementRecordListWithAuthors_AchievementRecord[];
}

export interface AchievementRecordListWithAuthorsVariables {
  where: AchievementRecord_bool_exp;
  limit?: number | null;
  offset?: number | null;
  orderBy?: AchievementRecord_order_by | null;
}
