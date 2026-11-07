/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteManualAttendances
// ====================================================

export interface DeleteManualAttendances_delete_Attendance {
  __typename: "Attendance_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteManualAttendances {
  /**
   * delete data from the table: "Attendance"
   */
  delete_Attendance: DeleteManualAttendances_delete_Attendance | null;
}

export interface DeleteManualAttendancesVariables {
  userId: any;
  sessionId: number;
}
