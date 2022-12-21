/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseTagline
// ====================================================

export interface UpdateCourseTagline_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseTagline {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseTagline_update_Course_by_pk | null;
}

export interface UpdateCourseTaglineVariables {
  courseId: number;
  tagline: string;
}
