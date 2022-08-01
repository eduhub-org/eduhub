/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertMyTeacher
// ====================================================

export interface InsertMyTeacher_insert_Teacher_returning {
  __typename: "Teacher";
  id: number;
}

export interface InsertMyTeacher_insert_Teacher {
  __typename: "Teacher_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertMyTeacher_insert_Teacher_returning[];
}

export interface InsertMyTeacher {
  /**
   * insert data into the table: "Teacher"
   */
  insert_Teacher: InsertMyTeacher_insert_Teacher | null;
}

export interface InsertMyTeacherVariables {
  myUserId: any;
}
