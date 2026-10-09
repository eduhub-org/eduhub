/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: EnrollmentHistoryFragment
// ====================================================

export interface EnrollmentHistoryFragment_Course_Program {
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
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
}

export interface EnrollmentHistoryFragment_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * An object relationship
   */
  Program: EnrollmentHistoryFragment_Course_Program;
}

export interface EnrollmentHistoryFragment_AttendanceStats {
  __typename: "CourseEnrollmentAttendanceStats";
  attendedSessions: number | null;
  totalSessions: number | null;
  pastSessions: number | null;
}

export interface EnrollmentHistoryFragment {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  created_at: any | null;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  /**
   * An object relationship
   */
  Course: EnrollmentHistoryFragment_Course;
  /**
   * An object relationship
   */
  AttendanceStats: EnrollmentHistoryFragment_AttendanceStats | null;
}
