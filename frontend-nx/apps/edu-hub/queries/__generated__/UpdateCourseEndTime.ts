/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseEndTime
// ====================================================

export interface UpdateCourseEndTime_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
}

export interface UpdateCourseEndTime {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseEndTime_update_Course_by_pk | null;
}

export interface UpdateCourseEndTimeVariables {
  courseId: number;
  value?: any | null;
}
