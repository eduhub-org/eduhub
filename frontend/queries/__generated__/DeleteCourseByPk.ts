/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseByPk
// ====================================================

export interface DeleteCourseByPk_delete_Course_by_pk {
  __typename: "Course";
  id: number;
}

export interface DeleteCourseByPk {
  /**
   * delete single row from the table: "Course"
   */
  delete_Course_by_pk: DeleteCourseByPk_delete_Course_by_pk | null;
}

export interface DeleteCourseByPkVariables {
  id: number;
}
