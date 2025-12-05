/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { User_bool_exp, User_order_by } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ExpertsByLastName
// ====================================================

export interface ExpertsByLastName_User_CourseInstructors_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface ExpertsByLastName_User_CourseInstructors_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * An object relationship
   */
  Program: ExpertsByLastName_User_CourseInstructors_Course_Program;
}

export interface ExpertsByLastName_User_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Course: ExpertsByLastName_User_CourseInstructors_Course;
}

export interface ExpertsByLastName_User_SessionSpeakers_Session_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
}

export interface ExpertsByLastName_User_SessionSpeakers_Session_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * An object relationship
   */
  Program: ExpertsByLastName_User_SessionSpeakers_Session_Course_Program;
}

export interface ExpertsByLastName_User_SessionSpeakers_Session {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
  /**
   * A description of the session
   */
  description: string;
  /**
   * An object relationship
   */
  Course: ExpertsByLastName_User_SessionSpeakers_Session_Course;
}

export interface ExpertsByLastName_User_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  Session: ExpertsByLastName_User_SessionSpeakers_Session;
}

export interface ExpertsByLastName_User {
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
  CourseInstructors: ExpertsByLastName_User_CourseInstructors[];
  /**
   * An array relationship
   */
  SessionSpeakers: ExpertsByLastName_User_SessionSpeakers[];
}

export interface ExpertsByLastName_User_aggregate_aggregate {
  __typename: "User_aggregate_fields";
  count: number;
}

export interface ExpertsByLastName_User_aggregate {
  __typename: "User_aggregate";
  aggregate: ExpertsByLastName_User_aggregate_aggregate | null;
}

export interface ExpertsByLastName {
  /**
   * fetch data from the table: "User"
   */
  User: ExpertsByLastName_User[];
  /**
   * fetch aggregated fields from the table: "User"
   */
  User_aggregate: ExpertsByLastName_User_aggregate;
}

export interface ExpertsByLastNameVariables {
  limit?: number | null;
  offset?: number | null;
  filter?: User_bool_exp | null;
  order_by?: User_order_by[] | null;
}
