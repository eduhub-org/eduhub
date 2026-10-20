/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseAttendanceImportParticipants
// ====================================================

export interface CourseAttendanceImportParticipants_CourseEnrollment_User_Attendances {
  __typename: "Attendance";
  id: number;
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

export interface CourseAttendanceImportParticipants_CourseEnrollment_User {
  __typename: "User";
  id: any;
  /**
   * The user's email address
   */
  email: string;
  /**
   * An array relationship
   */
  Attendances: CourseAttendanceImportParticipants_CourseEnrollment_User_Attendances[];
}

export interface CourseAttendanceImportParticipants_CourseEnrollment {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
  /**
   * An object relationship
   */
  User: CourseAttendanceImportParticipants_CourseEnrollment_User;
}

export interface CourseAttendanceImportParticipants {
  /**
   * fetch data from the table: "CourseEnrollment"
   */
  CourseEnrollment: CourseAttendanceImportParticipants_CourseEnrollment[];
}

export interface CourseAttendanceImportParticipantsVariables {
  courseId: number;
}
