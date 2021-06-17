/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseList
// ====================================================

export interface CourseList_Course_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Lastname: string;
  Id: number;
}

export interface CourseList_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  /**
   * An object relationship
   */
  Person: CourseList_Course_CourseInstructors_Instructor_Person;
  Description: string | null;
  Qualification: string | null;
  Id: number;
}

export interface CourseList_Course_CourseInstructors {
  __typename: "CourseInstructor";
  /**
   * An object relationship
   */
  Instructor: CourseList_Course_CourseInstructors_Instructor;
  Id: number;
}

export interface CourseList_Course_Sessions {
  __typename: "Session";
  Id: number;
  Description: string;
  Finish: any;
  Start: any;
  Title: string;
}

export interface CourseList_Course {
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
  CourseInstructors: CourseList_Course_CourseInstructors[];
  Ects: string;
  Status: number;
  MaxMissedDates: number;
  MaxProjectParticipants: number;
  /**
   * An array relationship
   */
  Sessions: CourseList_Course_Sessions[];
}

export interface CourseList {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseList_Course[];
}
