/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum, EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseListWithEnrollments
// ====================================================

export interface CourseListWithEnrollments_Course_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
}

export interface CourseListWithEnrollments_Course_CourseInstructors_Instructor_User {
  __typename: "User";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface CourseListWithEnrollments_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  User: CourseListWithEnrollments_Course_CourseInstructors_Instructor_User;
  Qualification: string | null;
  Description: string | null;
}

export interface CourseListWithEnrollments_Course_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: CourseListWithEnrollments_Course_CourseInstructors_Instructor;
}

export interface CourseListWithEnrollments_Course_Enrollments {
  __typename: "Enrollment";
  ExpirationDate: any | null;
  Id: number;
  Status: EnrollmentStatus_enum;
}

export interface CourseListWithEnrollments_Course_Program {
  __typename: "Program";
  ApplicationEnd: any | null;
  ApplicationStart: any | null;
  Id: number;
  End: any | null;
  Start: any | null;
  Name: string;
  PerformanceRecordDeadline: any | null;
}

export interface CourseListWithEnrollments_Course {
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
  Status: CourseStatus_enum;
  ShortDescription: string;
  TimeOfStart: any | null;
  /**
   * An array relationship
   */
  Sessions: CourseListWithEnrollments_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseListWithEnrollments_Course_CourseInstructors[];
  /**
   * An array relationship
   */
  Enrollments: CourseListWithEnrollments_Course_Enrollments[];
  /**
   * An object relationship
   */
  Program: CourseListWithEnrollments_Course_Program | null;
}

export interface CourseListWithEnrollments {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseListWithEnrollments_Course[];
}
