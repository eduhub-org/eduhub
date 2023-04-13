/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, CourseEnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: UesrsByLastName
// ====================================================

export interface UesrsByLastName_User_CourseEnrollments_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The title of the program
   */
  title: string;
}

export interface UesrsByLastName_User_CourseEnrollments_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: UesrsByLastName_User_CourseEnrollments_Course_Program;
}

export interface UesrsByLastName_User_CourseEnrollments {
  __typename: "CourseEnrollment";
  id: number;
  /**
   * The ID of the course of this enrollment from the given user
   */
  courseId: number;
  /**
   * The ID of the user that enrolled for the given course
   */
  userId: any;
  /**
   * The users current enrollment status to this course
   */
  status: CourseEnrollmentStatus_enum;
  updated_at: any | null;
  /**
   * An object relationship
   */
  Course: UesrsByLastName_User_CourseEnrollments_Course;
}

export interface UesrsByLastName_User {
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
  CourseEnrollments: UesrsByLastName_User_CourseEnrollments[];
}

export interface UesrsByLastName_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface UesrsByLastName_User_aggregate {
  __typename: "User_aggregate";
  aggregate: UesrsByLastName_User_aggregate_aggregate | null;
}

export interface UesrsByLastName {
  /**
   * fetch data from the table: "User"
   */
  User: UesrsByLastName_User[];
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: UesrsByLastName_User_aggregate;
}

export interface UesrsByLastNameVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: User_bool_exp | null;
}
