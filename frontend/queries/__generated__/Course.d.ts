/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Course
// ====================================================

export interface Course_Course_by_pk_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Lastname: string;
  Id: number;
}

export interface Course_Course_by_pk_CourseInstructors_Instructor {
  __typename: "Instructor";
  /**
   * An object relationship
   */
  Person: Course_Course_by_pk_CourseInstructors_Instructor_Person;
  Description: string | null;
  Qualification: string | null;
  Id: number;
}

export interface Course_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  /**
   * An object relationship
   */
  Instructor: Course_Course_by_pk_CourseInstructors_Instructor;
  Id: number;
}

export interface Course_Course_by_pk_Sessions {
  __typename: "Session";
  Id: number;
  Description: string;
  Finish: any;
  Start: any;
  Title: string;
}

export interface Course_Course_by_pk {
  __typename: "Course";
  BookingDeadline: any;
  Cost: string;
  CourseType: number | null;
  DayOfTheWeek: string | null;
  Description: string;
  Difficulty: number | null;
  Id: number;
  Image: string | null;
  Language: string;
  MaxParticipants: number;
  Name: string;
  Semester: number;
  ShortDescription: string;
  TimeOfStart: any | null;
  City: string;
  Duration: number | null;
  /**
   * An array relationship
   */
  CourseInstructors: Course_Course_by_pk_CourseInstructors[];
  Ects: string;
  Status: number;
  MaxMissedDates: number;
  MaxProjectParticipants: number;
  /**
   * An array relationship
   */
  Sessions: Course_Course_by_pk_Sessions[];
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
