/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseParticipationAttendances
// ====================================================

export interface CourseParticipationAttendances_Attendance {
  __typename: "Attendance";
  id: number;
  /**
   * The ID of the user for which the attendance was recorded (only provided if the recorded name was in accordance with the name of a user registered for the session)
   */
  userId: any | null;
  /**
   * The ID of the session for which the attendance was recorded
   */
  sessionId: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * The source that provided the recorded names of the attendees.
   */
  source: string;
}

export interface CourseParticipationAttendances {
  /**
   * fetch data from the table: "Attendance"
   */
  Attendance: CourseParticipationAttendances_Attendance[];
}

export interface CourseParticipationAttendancesVariables {
  courseId: number;
  userIds: any[];
}
