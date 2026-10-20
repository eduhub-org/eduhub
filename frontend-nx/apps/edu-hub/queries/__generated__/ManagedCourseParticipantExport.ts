/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum, AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ManagedCourseParticipantExport
// ====================================================

export interface ManagedCourseParticipantExport_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * If false, attendance is tracked but does not count toward passing (maxMissedSessions) or certificates
   */
  isMandatory: boolean;
  /**
   * Set for program-wide sessions (courseId is then NULL); shown in every course of the program
   */
  programId: number | null;
}

export interface ManagedCourseParticipantExport_Course_by_pk_Program_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * If false, attendance is tracked but does not count toward passing (maxMissedSessions) or certificates
   */
  isMandatory: boolean;
  /**
   * Set for program-wide sessions (courseId is then NULL); shown in every course of the program
   */
  programId: number | null;
}

export interface ManagedCourseParticipantExport_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  /**
   * An array relationship
   */
  Sessions: ManagedCourseParticipantExport_Course_by_pk_Program_Sessions[];
}

export interface ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
}

export interface ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User_Attendances {
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

export interface ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
  /**
   * The user's email address
   */
  email: string;
  /**
   * Free-text organization the user belongs to, e.g. entered during guest registration. Used when no organizationId is set.
   */
  organizationName: string | null;
  /**
   * An object relationship
   */
  Organization: ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User_Organization | null;
  /**
   * An array relationship
   */
  Attendances: ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User_Attendances[];
}

export interface ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * An object relationship
   */
  User: ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User;
}

export interface ManagedCourseParticipantExport_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An array relationship
   */
  Sessions: ManagedCourseParticipantExport_Course_by_pk_Sessions[];
  /**
   * An object relationship
   */
  Program: ManagedCourseParticipantExport_Course_by_pk_Program | null;
  /**
   * An array relationship
   */
  CourseEnrollments: ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments[];
}

export interface ManagedCourseParticipantExport {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: ManagedCourseParticipantExport_Course_by_pk | null;
}

export interface ManagedCourseParticipantExportVariables {
  id: number;
}
