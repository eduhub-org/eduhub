/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseInstructor
// ====================================================

export interface DeleteCourseInstructor_delete_CourseInstructor {
  __typename: "CourseInstructor_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteCourseInstructor {
  /**
   * delete data from the table: "CourseInstructor"
   */
  delete_CourseInstructor: DeleteCourseInstructor_delete_CourseInstructor | null;
}

export interface DeleteCourseInstructorVariables {
  courseId: number;
  expertId: number;
}
