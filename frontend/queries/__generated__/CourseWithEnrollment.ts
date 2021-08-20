/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum, EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseWithEnrollment
// ====================================================

export interface CourseWithEnrollment_Course_by_pk_Sessions_Attendences {
  __typename: "Attendence";
  Id: number;
  Attending: boolean;
}

export interface CourseWithEnrollment_Course_by_pk_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
  /**
   * An array relationship
   */
  Attendences: CourseWithEnrollment_Course_by_pk_Sessions_Attendences[];
}

export interface CourseWithEnrollment_Course_by_pk_CourseInstructors_Instructor_User {
  __typename: "User";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface CourseWithEnrollment_Course_by_pk_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  User: CourseWithEnrollment_Course_by_pk_CourseInstructors_Instructor_User;
  Qualification: string | null;
  Description: string | null;
}

export interface CourseWithEnrollment_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: CourseWithEnrollment_Course_by_pk_CourseInstructors_Instructor;
}

export interface CourseWithEnrollment_Course_by_pk_Enrollments {
  __typename: "Enrollment";
  ExpirationDate: any | null;
  Id: number;
  Status: EnrollmentStatus_enum;
}

export interface CourseWithEnrollment_Course_by_pk_Program {
  __typename: "Program";
  ApplicationEnd: any | null;
  ApplicationStart: any | null;
  Id: number;
  End: any | null;
  Start: any | null;
  Name: string;
  PerformanceRecordDeadline: any | null;
}

export interface CourseWithEnrollment_Course_by_pk {
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
  Sessions: CourseWithEnrollment_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseWithEnrollment_Course_by_pk_CourseInstructors[];
  /**
   * An array relationship
   */
  Enrollments: CourseWithEnrollment_Course_by_pk_Enrollments[];
  /**
   * An object relationship
   */
  Program: CourseWithEnrollment_Course_by_pk_Program | null;
}

export interface CourseWithEnrollment {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: CourseWithEnrollment_Course_by_pk | null;
}

export interface CourseWithEnrollmentVariables {
  id: number;
  authId: any;
}
