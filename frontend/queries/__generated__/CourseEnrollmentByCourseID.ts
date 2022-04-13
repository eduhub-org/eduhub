/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { AttendanceStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseEnrollmentByCourseID
// ====================================================

export interface CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User_Attendances_Session {
  __typename: "Session";
  id: number;
}

export interface CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User_Attendances {
  __typename: "Attendance";
  id: number;
  /**
   * The attendance status: MISSED for a user registered for the session but not recorded (or recognized), otherwise ATTENDED
   */
  status: AttendanceStatus_enum;
  /**
   * An object relationship
   */
  Session: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User_Attendances_Session;
}

export interface CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User {
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
   * An array relationship
   */
  Attendances: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User_Attendances[];
}

export interface CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * An object relationship
   */
  User: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments_User;
}

export interface CourseEnrollmentByCourseID_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
}

export interface CourseEnrollmentByCourseID_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * An array relationship
   */
  CourseEnrollments: CourseEnrollmentByCourseID_Course_by_pk_CourseEnrollments[];
  /**
   * An array relationship
   */
  Sessions: CourseEnrollmentByCourseID_Course_by_pk_Sessions[];
}

export interface CourseEnrollmentByCourseID {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: CourseEnrollmentByCourseID_Course_by_pk | null;
}

export interface CourseEnrollmentByCourseIDVariables {
  courseId: number;
}
