/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Weekday_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateCourseWeekday
// ====================================================

export interface UpdateCourseWeekday_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseWeekday {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseWeekday_update_Course_by_pk | null;
}

export interface UpdateCourseWeekdayVariables {
  courseId: number;
  weekday: Weekday_enum;
}
