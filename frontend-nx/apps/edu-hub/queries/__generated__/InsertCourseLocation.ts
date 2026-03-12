/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertCourseLocation
// ====================================================

export interface InsertCourseLocation_insert_CourseLocation_returning {
  __typename: "CourseLocation";
  id: number;
}

export interface InsertCourseLocation_insert_CourseLocation {
  __typename: "CourseLocation_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertCourseLocation_insert_CourseLocation_returning[];
}

export interface InsertCourseLocation {
  /**
   * insert data into the table: "CourseLocation"
   */
  insert_CourseLocation: InsertCourseLocation_insert_CourseLocation | null;
}

export interface InsertCourseLocationVariables {
  courseId: number;
  option: LocationOption_enum;
}
