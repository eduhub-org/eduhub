/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseGroup
// ====================================================

export interface DeleteCourseGroup_delete_CourseGroup {
  __typename: "CourseGroup_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteCourseGroup {
  /**
   * delete data from the table: "CourseGroup"
   */
  delete_CourseGroup: DeleteCourseGroup_delete_CourseGroup | null;
}

export interface DeleteCourseGroupVariables {
  courseId: number;
  courseGroupOptionId: number;
}
