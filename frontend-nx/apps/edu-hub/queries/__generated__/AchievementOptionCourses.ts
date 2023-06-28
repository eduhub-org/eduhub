/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionCourse_bool_exp, AchievementOptionCourse_order_by, AchievementRecordType_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionCourses
// ====================================================

export interface AchievementOptionCourses_AchievementOptionCourse_AchievementOption {
  __typename: "AchievementOption";
  id: number;
  /**
   * Title of an offered achievement option
   */
  title: string;
  /**
   * Description of an offered achievement option
   */
  description: string | null;
  /**
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
  /**
   * An instructor or project mentor can provide a template for the record that must be uploaded to complete this achievement
   */
  documentationTemplateUrl: string | null;
  /**
   * If the record tye is "DOCUMENTATION_AND_CSV" an URL to a python script can be provided that returns a score for uploaded csv data.
   */
  evaluationScriptUrl: string | null;
  /**
   * URL to the template that shall be used for uploading csv data for a new achievement record
   */
  csvTemplateUrl: string | null;
  /**
   * For TRUE the score table will include a column showing the authors; for FALSE the scores will be anonymous.
   */
  showScoreAuthors: boolean | null;
}

export interface AchievementOptionCourses_AchievementOptionCourse {
  __typename: "AchievementOptionCourse";
  /**
   * An object relationship
   */
  AchievementOption: AchievementOptionCourses_AchievementOptionCourse_AchievementOption;
  id: number;
  /**
   * ID of a course for which this achievement optoin can be selected to provided an achievement record.
   */
  courseId: number;
  /**
   * ID of an achievement option that can be selected for a given course
   */
  achievementOptionId: number;
  created_at: any;
}

export interface AchievementOptionCourses {
  /**
   * fetch data from the table: "AchievementOptionCourse"
   */
  AchievementOptionCourse: AchievementOptionCourses_AchievementOptionCourse[];
}

export interface AchievementOptionCoursesVariables {
  where?: AchievementOptionCourse_bool_exp | null;
  limit?: number | null;
  offset?: number | null;
  orderByAchievementOptionCourse?: AchievementOptionCourse_order_by | null;
}
