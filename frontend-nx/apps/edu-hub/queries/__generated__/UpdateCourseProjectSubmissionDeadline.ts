/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseProjectSubmissionDeadline
// ====================================================

export interface UpdateCourseProjectSubmissionDeadline_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Per-course override for the project submission deadline. When NULL, Program.defaultProjectSubmissionDeadline applies.
   */
  projectSubmissionDeadline: any | null;
}

export interface UpdateCourseProjectSubmissionDeadline {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseProjectSubmissionDeadline_update_Course_by_pk | null;
}

export interface UpdateCourseProjectSubmissionDeadlineVariables {
  itemId: number;
  value?: any | null;
}
