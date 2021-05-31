/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Course
// ====================================================

export interface Course_Course_by_pk_Sessions {
  __typename: "Session";
  Description: string;
  Finish: any;
  Id: number;
  Start: any;
  Title: string;
  SurveyType: number | null;
  SurveyId: string | null;
}

export interface Course_Course_by_pk {
  __typename: "Course";
  BookingDeadline: any;
  Cost: string;
  CourseType: number | null;
  DayOfTheWeek: string | null;
  Description: string;
  Difficulty: number | null;
  Duration: number | null;
  Ects: string;
  Id: number;
  Image: string | null;
  Language: string;
  MaxParticipants: number;
  Name: string;
  Semester: number;
  /**
   * An array relationship
   */
  Sessions: Course_Course_by_pk_Sessions[];
  ShortDescription: string;
  Status: number;
  TimeOfStart: any | null;
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
