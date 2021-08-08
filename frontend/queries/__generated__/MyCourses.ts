/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EnrollmentStatus_enum, CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyCourses
// ====================================================

export interface MyCourses_Enrollment_Course_Semester {
  __typename: "Semester";
  ApplicationEnd: any | null;
  ApplicationStart: any | null;
  Id: number;
  End: any | null;
  Start: any | null;
  Name: string;
  PerformanceRecordDeadline: any | null;
}

export interface MyCourses_Enrollment_Course_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
}

export interface MyCourses_Enrollment_Course_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface MyCourses_Enrollment_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  Person: MyCourses_Enrollment_Course_CourseInstructors_Instructor_Person;
  Qualification: string | null;
  Description: string | null;
}

export interface MyCourses_Enrollment_Course_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: MyCourses_Enrollment_Course_CourseInstructors_Instructor;
}

export interface MyCourses_Enrollment_Course_Enrollments {
  __typename: "Enrollment";
  Id: number;
  Status: EnrollmentStatus_enum;
}

export interface MyCourses_Enrollment_Course {
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
  /**
   * An object relationship
   */
  Semester: MyCourses_Enrollment_Course_Semester | null;
  Status: CourseStatus_enum;
  ShortDescription: string;
  TimeOfStart: any | null;
  /**
   * An array relationship
   */
  Sessions: MyCourses_Enrollment_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: MyCourses_Enrollment_Course_CourseInstructors[];
  /**
   * An array relationship
   */
  Enrollments: MyCourses_Enrollment_Course_Enrollments[];
}

export interface MyCourses_Enrollment {
  __typename: "Enrollment";
  Id: number;
  Status: EnrollmentStatus_enum;
  /**
   * An object relationship
   */
  Course: MyCourses_Enrollment_Course;
}

export interface MyCourses {
  /**
   * fetch data from the table: "Enrollment"
   */
  Enrollment: MyCourses_Enrollment[];
}
