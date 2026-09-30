/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseSeriesRuns
// ====================================================

export interface CourseSeriesRuns_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
}

export interface CourseSeriesRuns_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: CourseSeriesRuns_Course_Program;
}

export interface CourseSeriesRuns {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseSeriesRuns_Course[];
}

export interface CourseSeriesRunsVariables {
  courseSeriesId: number;
}
