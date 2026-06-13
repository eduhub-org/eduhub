/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseGroupOption
// ====================================================

export interface DeleteCourseGroupOption_delete_CourseGroupOption_by_pk {
  __typename: "CourseGroupOption";
  id: number;
}

export interface DeleteCourseGroupOption {
  /**
   * delete single row from the table: "CourseGroupOption"
   */
  delete_CourseGroupOption_by_pk: DeleteCourseGroupOption_delete_CourseGroupOption_by_pk | null;
}

export interface DeleteCourseGroupOptionVariables {
  id: number;
}
