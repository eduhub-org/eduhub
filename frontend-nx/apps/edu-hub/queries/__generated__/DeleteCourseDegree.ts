/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseDegree
// ====================================================

export interface DeleteCourseDegree_delete_CourseDegree {
  __typename: "CourseDegree_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteCourseDegree {
  /**
   * delete data from the table: "CourseDegree"
   */
  delete_CourseDegree: DeleteCourseDegree_delete_CourseDegree | null;
}

export interface DeleteCourseDegreeVariables {
  courseId: number;
  degreeCourseId: number;
}
