/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Attendance_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertAttendances
// ====================================================

export interface InsertAttendances_insert_Attendance {
  __typename: "Attendance_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface InsertAttendances {
  /**
   * insert data into the table: "Attendance"
   */
  insert_Attendance: InsertAttendances_insert_Attendance | null;
}

export interface InsertAttendancesVariables {
  objects: Attendance_insert_input[];
}
