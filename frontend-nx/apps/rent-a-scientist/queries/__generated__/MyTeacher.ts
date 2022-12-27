/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: MyTeacher
// ====================================================

export interface MyTeacher_Teacher {
  __typename: "Teacher";
  id: number;
  userId: any;
}

export interface MyTeacher {
  /**
   * fetch data from the table: "Teacher"
   */
  Teacher: MyTeacher_Teacher[];
}
