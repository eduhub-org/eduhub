/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseTitle
// ====================================================

export interface UpdateCourseTitle_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseTitle {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseTitle_update_Course_by_pk | null;
}

export interface UpdateCourseTitleVariables {
  courseId: number;
  courseTitle: string;
}
