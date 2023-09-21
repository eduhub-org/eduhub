/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: DegreeParticipantsWithDegreeEnrollments
// ====================================================

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
}

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course {
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
  Program: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course_Program;
}

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * URL to the file containing the user's achievement certificate (if he obtained one)
   */
  achievementCertificateURL: string | null;
  updated_at: any | null;
  /**
   * An object relationship
   */
  Course: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments_Course;
}

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User {
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
  CourseEnrollments: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User_CourseEnrollments[];
}

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  /**
   * An object relationship
   */
  User: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments_User;
}

export interface DegreeParticipantsWithDegreeEnrollments_Course_by_pk {
  __typename: "Course";
  /**
   * An array relationship
   */
  CourseEnrollments: DegreeParticipantsWithDegreeEnrollments_Course_by_pk_CourseEnrollments[];
}

export interface DegreeParticipantsWithDegreeEnrollments {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: DegreeParticipantsWithDegreeEnrollments_Course_by_pk | null;
}

export interface DegreeParticipantsWithDegreeEnrollmentsVariables {
  degreeCourseId: number;
}
