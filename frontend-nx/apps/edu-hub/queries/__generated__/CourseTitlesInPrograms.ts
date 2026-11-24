/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseTitlesInPrograms
// ====================================================

export interface CourseTitlesInPrograms_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number;
}

export interface CourseTitlesInPrograms {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseTitlesInPrograms_Course[];
}

export interface CourseTitlesInProgramsVariables {
  programIds: number[];
}
