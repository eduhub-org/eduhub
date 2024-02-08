/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseContentDescriptionField2
// ====================================================

export interface UpdateCourseContentDescriptionField2_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseContentDescriptionField2 {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseContentDescriptionField2_update_Course_by_pk | null;
}

export interface UpdateCourseContentDescriptionField2Variables {
  itemId: number;
  text: string;
}
