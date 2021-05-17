/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseList
// ====================================================

export interface CourseList_Course {
  __typename: "Course";
  Cost: string;
  DayOfTheWeek: string | null;
  CourseType: number | null;
  Description: string;
  Difficulty: number | null;
  Duration: number | null;
  Ects: string;
  Id: number;
  Language: string;
  MaxParticipants: number;
  Name: string;
  Semester: number;
  ShortDescription: string;
  TimeOfStart: any | null;
}

export interface CourseList {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseList_Course[];
}
