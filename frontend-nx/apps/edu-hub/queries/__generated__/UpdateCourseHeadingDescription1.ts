/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseHeadingDescription1
// ====================================================

export interface UpdateCourseHeadingDescription1_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseHeadingDescription1 {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseHeadingDescription1_update_Course_by_pk | null;
}

export interface UpdateCourseHeadingDescription1Variables {
  itemId: number;
  text: string;
}
