/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: PublishCourses
// ====================================================

export interface PublishCourses_update_Course {
  __typename: "Course_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface PublishCourses {
  /**
   * update data of the table: "Course"
   */
  update_Course: PublishCourses_update_Course | null;
}

export interface PublishCoursesVariables {
  ids: number[];
}
