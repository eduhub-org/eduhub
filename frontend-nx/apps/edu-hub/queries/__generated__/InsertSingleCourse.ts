/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertSingleCourse
// ====================================================

export interface InsertSingleCourse_insert_Course_one {
  __typename: "Course";
  id: number;
}

export interface InsertSingleCourse {
  /**
   * insert a single row into the table: "Course"
   */
  insert_Course_one: InsertSingleCourse_insert_Course_one | null;
}

export interface InsertSingleCourseVariables {
  course: Course_insert_input;
}
