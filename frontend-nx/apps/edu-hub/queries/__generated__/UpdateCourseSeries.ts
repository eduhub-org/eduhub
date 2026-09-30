/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseSeries
// ====================================================

export interface UpdateCourseSeries_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Links this course to its CourseSeries (the set of all iterations of the same course). Used to surface projects from past iterations.
   */
  courseSeriesId: number | null;
}

export interface UpdateCourseSeries {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseSeries_update_Course_by_pk | null;
}

export interface UpdateCourseSeriesVariables {
  itemId: number;
  value?: number | null;
}
