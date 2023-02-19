/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourse
// ====================================================

export interface InsertCourse_insert_Course_returning {
  __typename: "Course";
  id: number;
}

export interface InsertCourse_insert_Course {
  __typename: "Course_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertCourse_insert_Course_returning[];
}

export interface InsertCourse {
  /**
   * insert data into the table: "Course"
   */
  insert_Course: InsertCourse_insert_Course | null;
}

export interface InsertCourseVariables {
  title: string;
  applicationEnd: any;
  maxMissedSessions: number;
  programId: number;
}
