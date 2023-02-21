/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementRecordRating_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: AchievementRecordFragment
// ====================================================

export interface AchievementRecordFragment {
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
  description: string;
  /**
   * ID of hte achievement option the record is uploaded for.
   */
  achievementOptionId: number | null;
  /**
   * ID of the user who uploaded the record
   */
  uploadUserId: any;
  /**
   * Image that will be used for the project gallery
   */
  coverImageUrl: string;
  /**
   * Score calculated for possibly uploaded csv data.
   */
  score: any;
  /**
   * The course instructor's or mentor's rating for the achievement record
   */
  rating: AchievementRecordRating_enum;
  /**
   * URL to the uploaded file with the documentation of the record.
   */
  documentationUrl: string | null;
}
