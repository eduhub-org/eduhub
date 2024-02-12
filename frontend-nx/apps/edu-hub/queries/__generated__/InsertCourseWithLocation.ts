/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertCourseWithLocation
// ====================================================

export interface InsertCourseWithLocation_insert_Course_returning_CourseLocations {
  __typename: "CourseLocation";
  id: number;
}

export interface InsertCourseWithLocation_insert_Course_returning {
  __typename: "Course";
  id: number;
  /**
   * An array relationship
   */
  CourseLocations: InsertCourseWithLocation_insert_Course_returning_CourseLocations[];
}

export interface InsertCourseWithLocation_insert_Course {
  __typename: "Course_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertCourseWithLocation_insert_Course_returning[];
}

export interface InsertCourseWithLocation {
  /**
   * insert data into the table: "Course"
   */
  insert_Course: InsertCourseWithLocation_insert_Course | null;
}

export interface InsertCourseWithLocationVariables {
  title: string;
  applicationEnd: any;
  maxMissedSessions: number;
  programId: number;
  locationOption: LocationOption_enum;
}
