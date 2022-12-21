/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Attendance_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertSingleAttendence
// ====================================================

export interface InsertSingleAttendence_insert_Attendance_one {
  __typename: "Attendance";
  id: number;
}

export interface InsertSingleAttendence {
  /**
   * insert a single row into the table: "Attendance"
   */
  insert_Attendance_one: InsertSingleAttendence_insert_Attendance_one | null;
}

export interface InsertSingleAttendenceVariables {
  input: Attendance_insert_input;
}
