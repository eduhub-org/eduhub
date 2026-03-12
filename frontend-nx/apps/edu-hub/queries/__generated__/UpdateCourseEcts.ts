/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseEcts
// ====================================================

export interface UpdateCourseEcts_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseEcts {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseEcts_update_Course_by_pk | null;
}

export interface UpdateCourseEctsVariables {
  itemId: number;
  text: string;
}
