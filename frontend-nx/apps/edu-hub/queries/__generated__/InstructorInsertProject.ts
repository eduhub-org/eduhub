/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InstructorInsertProject
// ====================================================

export interface InstructorInsertProject_insert_Project_one {
  __typename: "Project";
  id: number;
}

export interface InstructorInsertProject {
  /**
   * insert a single row into the table: "Project"
   */
  insert_Project_one: InstructorInsertProject_insert_Project_one | null;
}

export interface InstructorInsertProjectVariables {
  title: string;
  type?: string | null;
  proposedByUserId: any;
  courseId: number;
}
