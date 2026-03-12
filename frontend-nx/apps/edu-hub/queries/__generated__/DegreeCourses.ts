/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: DegreeCourses
// ====================================================

export interface DegreeCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface DegreeCourses {
  /**
   * fetch data from the table: "Course"
   */
  Course: DegreeCourses_Course[];
}
