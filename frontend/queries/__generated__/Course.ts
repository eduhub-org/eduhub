/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: Course
// ====================================================

export interface Course_Course_by_pk_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
}

export interface Course_Course_by_pk_CourseInstructors_Instructor_Person {
  __typename: "User";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface Course_Course_by_pk_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  Person: Course_Course_by_pk_CourseInstructors_Instructor_Person;
  Qualification: string | null;
  Description: string | null;
}

export interface Course_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: Course_Course_by_pk_CourseInstructors_Instructor;
}

export interface Course_Course_by_pk {
  __typename: "Course";
  Id: number;
  Ects: string;
  Duration: number | null;
  Description: string;
  DayOfTheWeek: string | null;
  CourseType: number | null;
  Cost: string;
  City: string;
  BookingDeadline: any;
  Image: string | null;
  Language: string;
  MaxMissedDates: number;
  MaxParticipants: number;
  Name: string;
  OnlineCourses: string;
  ProgramId: number | null;
  Status: CourseStatus_enum;
  ShortDescription: string;
  TimeOfStart: any | null;
  /**
   * An array relationship
   */
  Sessions: Course_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: Course_Course_by_pk_CourseInstructors[];
}

export interface Course {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: Course_Course_by_pk | null;
}

export interface CourseVariables {
  id: number;
}
