/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: CopyCoursesToProgram
// ====================================================

export interface CopyCoursesToProgram_insert_Course_returning {
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

export interface CopyCoursesToProgram_insert_Course {
  __typename: "Course_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: CopyCoursesToProgram_insert_Course_returning[];
}

export interface CopyCoursesToProgram {
  /**
   * insert data into the table: "Course"
   */
  insert_Course: CopyCoursesToProgram_insert_Course | null;
}

export interface CopyCoursesToProgramVariables {
  courses: Course_insert_input[];
}
