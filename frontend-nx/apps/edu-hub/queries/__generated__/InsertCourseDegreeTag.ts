/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseDegreeTag
// ====================================================

export interface InsertCourseDegreeTag_insert_CourseDegree {
  __typename: "CourseDegree_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface InsertCourseDegreeTag {
  /**
   * insert data into the table: "CourseDegree"
   */
  insert_CourseDegree: InsertCourseDegreeTag_insert_CourseDegree | null;
}

export interface InsertCourseDegreeTagVariables {
  itemId: number;
  tagId: number;
}
