/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AchievementOptionCourse_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: AchievementOptionCourses
// ====================================================

export interface AchievementOptionCourses_AchievementOptionCourse_AchievementOption {
  __typename: "AchievementOption";
  /**
   * Title of an offered achievement option
   */
  title: string;
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
}

export interface AchievementOptionCourses {
  /**
   * fetch data from the table: "AchievementOptionCourse"
   */
  AchievementOptionCourse: AchievementOptionCourses_AchievementOptionCourse[];
}

export interface AchievementOptionCoursesVariables {
  where: AchievementOptionCourse_bool_exp;
  limit?: number | null;
  offset?: number | null;
}
