/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EnrollmentStatus_enum, CourseStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: MyCourses
// ====================================================

export interface MyCourses_Enrollment_Course_Sessions {
  __typename: "Session";
  Id: number;
  endDateTime: any;
  CourseId: number;
  Description: string;
  Location: string;
  startDateTime: any;
  Name: string;
}

export interface MyCourses_Enrollment_Course_CourseInstructors_Instructor_User {
  __typename: "User";
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
  User: MyCourses_Enrollment_Course_CourseInstructors_Instructor_User;
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
  ExpirationDate: any | null;
  Id: number;
  Status: EnrollmentStatus_enum;
}

export interface MyCourses_Enrollment_Course_Program {
  __typename: "Program";
  ApplicationEnd: any | null;
  ApplicationStart: any | null;
  Id: number;
  End: any | null;
  Start: any | null;
  Name: string;
  PerformanceRecordDeadline: any | null;
}

export interface MyCourses_Enrollment_Course {
  __typename: "Course";
  Id: number;
  Ects: string;
  Description: string;
  WeekDay: string | null;
  CourseType: number | null;
  Cost: string;
  City: string;
  ApplicationEnd: any;
  Image: string | null;
  Language: string;
  MaxMissedSessions: number;
  MaxParticipants: number;
  Name: string;
  OnlineCourses: string;
  Status: CourseStatus_enum;
  ShortDescription: string;
  LinkChat: string | null;
  LinkVideoCall: string | null;
  TimeStart: any | null;
  TimeEnd: any | null;
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
  /**
   * An object relationship
   */
  Program: MyCourses_Enrollment_Course_Program | null;
}

export interface MyCourses_Enrollment {
  __typename: "Enrollment";
  ExpirationDate: any | null;
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
