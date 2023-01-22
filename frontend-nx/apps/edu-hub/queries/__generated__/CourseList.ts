/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_bool_exp, Weekday_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseList
// ====================================================

export interface CourseList_Course_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The title of the session
   */
  title: string;
}

export interface CourseList_Course_CourseInstructors_Expert_User {
  __typename: "User";
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's profile picture
   */
  picture: string | null;
  id: any;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface CourseList_Course_CourseInstructors_Expert {
  __typename: "Expert";
  id: number;
  /**
   * An object relationship
   */
  User: CourseList_Course_CourseInstructors_Expert_User;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface CourseList_Course_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: CourseList_Course_CourseInstructors_Expert;
}

export interface CourseList_Course_Program {
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

export interface CourseList_Course {
  __typename: "Course";
  id: number;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The day of the week the course takes place.
   */
  weekDay: Weekday_enum | null;
  /**
   * A text providing info about the costs of a participation.
   */
  cost: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string | null;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number | null;
  /**
   * The number of maximum participants in the course.
   */
  maxParticipants: number | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * An array relationship
   */
  Sessions: CourseList_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseList_Course_CourseInstructors[];
  /**
   * An object relationship
   */
  Program: CourseList_Course_Program | null;
}

export interface CourseList {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseList_Course[];
}

export interface CourseListVariables {
  where: Course_bool_exp;
}
