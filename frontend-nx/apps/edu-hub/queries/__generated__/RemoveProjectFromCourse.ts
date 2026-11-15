/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: RemoveProjectFromCourse
// ====================================================

export interface RemoveProjectFromCourse_delete_ProjectCourse {
  __typename: "ProjectCourse_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface RemoveProjectFromCourse {
  /**
   * delete data from the table: "ProjectCourse"
   */
  delete_ProjectCourse: RemoveProjectFromCourse_delete_ProjectCourse | null;
}

export interface RemoveProjectFromCourseVariables {
  projectId: number;
  courseId: number;
}
