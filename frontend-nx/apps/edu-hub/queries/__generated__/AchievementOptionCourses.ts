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
   * Type of the achivement record that must be uploaded for this option
   */
  recordType: AchievementRecordType_enum;
  created_at: any | null;
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
