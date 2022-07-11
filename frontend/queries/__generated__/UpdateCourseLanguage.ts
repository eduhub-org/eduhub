/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseLanguage
// ====================================================

export interface UpdateCourseLanguage_update_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface UpdateCourseLanguage {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseLanguage_update_Course_by_pk | null;
}

export interface UpdateCourseLanguageVariables {
  courseId: number;
  language: string;
}
