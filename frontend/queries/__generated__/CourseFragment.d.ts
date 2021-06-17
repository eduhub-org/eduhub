/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL fragment: CourseFragment
// ====================================================

export interface CourseFragment_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Lastname: string;
  Id: number;
}

export interface CourseFragment_CourseInstructors_Instructor {
  __typename: "Instructor";
  /**
   * An object relationship
   */
  Person: CourseFragment_CourseInstructors_Instructor_Person;
  Description: string | null;
  Qualification: string | null;
  Id: number;
}

export interface CourseFragment_CourseInstructors {
  __typename: "CourseInstructor";
  /**
   * An object relationship
   */
  Instructor: CourseFragment_CourseInstructors_Instructor;
  Id: number;
}

export interface CourseFragment_Sessions {
  __typename: "Session";
  Id: number;
  Description: string;
  Finish: any;
  Start: any;
  Title: string;
}

export interface CourseFragment {
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
  CourseInstructors: CourseFragment_CourseInstructors[];
  Ects: string;
  Status: number;
  MaxMissedDates: number;
  MaxProjectParticipants: number;
  /**
   * An array relationship
   */
  Sessions: CourseFragment_Sessions[];
}
