/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MultiProgramEnrollments
// ====================================================

export interface MultiProgramEnrollments_Program_Courses_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * URL to the file containing the user's attendance certificate (if he obtained one)
   */
  attendanceCertificateURL: string | null;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  created_at: any | null;
  updated_at: any | null;
}

export interface MultiProgramEnrollments_Program_Courses {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An array relationship
   */
  CourseEnrollments: MultiProgramEnrollments_Program_Courses_CourseEnrollments[];
}

export interface MultiProgramEnrollments_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * An array relationship
   */
  Courses: MultiProgramEnrollments_Program_Courses[];
}

export interface MultiProgramEnrollments {
  /**
   * fetch data from the table: "Program"
   */
  Program: MultiProgramEnrollments_Program[];
}

export interface MultiProgramEnrollmentsVariables {
  programIds?: number[] | null;
}
