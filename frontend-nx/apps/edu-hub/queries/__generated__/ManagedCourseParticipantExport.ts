/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

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
}

export interface ManagedCourseParticipantExport_Course_by_pk_CourseEnrollments_User_Organization {
  __typename: "Organization";
  id: number;
  name: string;
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
