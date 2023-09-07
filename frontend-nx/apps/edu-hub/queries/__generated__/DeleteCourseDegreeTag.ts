/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseDegreeTag
// ====================================================

export interface DeleteCourseDegreeTag_delete_CourseDegree {
  __typename: "CourseDegree_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteCourseDegreeTag {
  /**
   * delete data from the table: "CourseDegree"
   */
  delete_CourseDegree: DeleteCourseDegreeTag_delete_CourseDegree | null;
}

export interface DeleteCourseDegreeTagVariables {
  itemId: number;
  tagId: number;
}
