/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: SetManualAttendance
// ====================================================

export interface SetManualAttendance_delete_Attendance {
  __typename: "Attendance_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface SetManualAttendance_insert_Attendance_one {
  __typename: "Attendance";
  id: number;
}

export interface SetManualAttendance {
  /**
   * delete data from the table: "Attendance"
   */
  delete_Attendance: SetManualAttendance_delete_Attendance | null;
  /**
   * insert a single row into the table: "Attendance"
   */
  insert_Attendance_one: SetManualAttendance_insert_Attendance_one | null;
}

export interface SetManualAttendanceVariables {
  userId: any;
  sessionId: number;
  status: AttendanceStatus_enum;
}
