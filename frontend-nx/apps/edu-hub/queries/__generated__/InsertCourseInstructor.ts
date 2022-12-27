/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertCourseInstructor
// ====================================================

export interface InsertCourseInstructor_insert_CourseInstructor_returning {
  __typename: "CourseInstructor";
  id: number;
}

export interface InsertCourseInstructor_insert_CourseInstructor {
  __typename: "CourseInstructor_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertCourseInstructor_insert_CourseInstructor_returning[];
}

export interface InsertCourseInstructor {
  /**
   * insert data into the table: "CourseInstructor"
   */
  insert_CourseInstructor: InsertCourseInstructor_insert_CourseInstructor | null;
}

export interface InsertCourseInstructorVariables {
  courseId: number;
  expertId: number;
}
