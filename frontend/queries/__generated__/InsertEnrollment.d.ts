/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseStatus_enum, EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertEnrollment
// ====================================================

export interface InsertEnrollment_insert_Enrollment_returning_Course_Sessions {
  __typename: "Session";
  Id: number;
  Finish: any;
  CourseId: number;
  Description: string;
  Location: string;
  Start: any;
  Title: string;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Id: number;
  Lastname: string;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  Id: number;
  /**
   * An object relationship
   */
  Person: InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Instructor_Person;
  Qualification: string | null;
  Description: string | null;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors {
  __typename: "CourseInstructor";
  Id: number;
  /**
   * An object relationship
   */
  Instructor: InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Instructor;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course {
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
  Sessions: InsertEnrollment_insert_Enrollment_returning_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors[];
}

export interface InsertEnrollment_insert_Enrollment_returning_Participant_Person {
  __typename: "Person";
  Id: number;
  Firstname: string;
  Lastname: string;
}

export interface InsertEnrollment_insert_Enrollment_returning_Participant {
  __typename: "Participant";
  Id: number;
  /**
   * An object relationship
   */
  Person: InsertEnrollment_insert_Enrollment_returning_Participant_Person;
}

export interface InsertEnrollment_insert_Enrollment_returning {
  __typename: "Enrollment";
  Id: number;
  /**
   * An object relationship
   */
  Course: InsertEnrollment_insert_Enrollment_returning_Course;
  /**
   * An object relationship
   */
  Participant: InsertEnrollment_insert_Enrollment_returning_Participant;
  Status: EnrollmentStatus_enum;
}

export interface InsertEnrollment_insert_Enrollment {
  __typename: "Enrollment_mutation_response";
  /**
   * number of affected rows by the mutation
   */
  affected_rows: number;
  /**
   * data of the affected rows by the mutation
   */
  returning: InsertEnrollment_insert_Enrollment_returning[];
}

export interface InsertEnrollment {
  /**
   * insert data into the table: "Enrollment"
   */
  insert_Enrollment: InsertEnrollment_insert_Enrollment | null;
}

export interface InsertEnrollmentVariables {
  participantId: number;
  courseId: number;
  motivationLetter: string;
}
