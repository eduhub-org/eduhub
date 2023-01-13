/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseHeadingDescription2
// ====================================================

export interface UpdateCourseHeadingDescription2_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseHeadingDescription2 {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseHeadingDescription2_update_Course_by_pk | null;
}

export interface UpdateCourseHeadingDescription2Variables {
  courseId: number;
  description: string;
}
