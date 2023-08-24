/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseDegree
// ====================================================

export interface InsertCourseDegree_insert_CourseDegree {
  __typename: "CourseDegree_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface InsertCourseDegree {
  /**
   * insert data into the table: "CourseDegree"
   */
  insert_CourseDegree: InsertCourseDegree_insert_CourseDegree | null;
}

export interface InsertCourseDegreeVariables {
  courseId: number;
  degreeCourseId: number;
}
