/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseGroup
// ====================================================

export interface InsertCourseGroup_insert_CourseGroup {
  __typename: "CourseGroup_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface InsertCourseGroup {
  /**
   * insert data into the table: "CourseGroup"
   */
  insert_CourseGroup: InsertCourseGroup_insert_CourseGroup | null;
}

export interface InsertCourseGroupVariables {
  courseId: number;
  courseGroupOptionId: number;
}
