/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseSeriesInfo
// ====================================================

export interface CourseSeriesInfo_Course {
  __typename: "Course";
  id: number;
  /**
   * Links this course to its CourseSeries (the set of all iterations of the same course). Used to surface projects from past iterations.
   */
  courseSeriesId: number | null;
}

export interface CourseSeriesInfo {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseSeriesInfo_Course[];
}

export interface CourseSeriesInfoVariables {
  id: number;
}
