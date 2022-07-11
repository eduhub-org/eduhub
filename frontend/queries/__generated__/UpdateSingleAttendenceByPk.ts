/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Attendance_set_input, AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateSingleAttendenceByPk
// ====================================================

export interface UpdateSingleAttendenceByPk_update_Attendance_by_pk {
  __typename: "Attendance";
  id: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
}

export interface UpdateSingleAttendenceByPk {
  /**
   * update single row of the table: "Attendance"
   */
  update_Attendance_by_pk: UpdateSingleAttendenceByPk_update_Attendance_by_pk | null;
}

export interface UpdateSingleAttendenceByPkVariables {
  pkId: number;
  changes: Attendance_set_input;
}
