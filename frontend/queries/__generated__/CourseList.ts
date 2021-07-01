/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseList
// ====================================================

export interface CourseList_Course_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
}

export interface CourseList_Course_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface CourseList_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  Person: CourseList_Course_CourseInstructors_Instructor_Person;
  Qualification: string | null;
  Description: string | null;
}

export interface CourseList_Course_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: CourseList_Course_CourseInstructors_Instructor;
}

export interface CourseList_Course {
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
  MaxParticipants: number;
  Name: string;
  OnlineCourses: string;
  SemesterId: number | null;
  Status: CourseStatus_enum;
  ShortDescription: string;
  TimeOfStart: any | null;
  /**
   * An array relationship
   */
  Sessions: CourseList_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseList_Course_CourseInstructors[];
}

export interface CourseList {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseList_Course[];
}
