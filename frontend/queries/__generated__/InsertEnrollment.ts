/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { EnrollmentStatus_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertEnrollment
// ====================================================

export interface InsertEnrollment_insert_Enrollment_returning_Course_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * The ID of the course the session belongs to
   */
  courseId: number;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The title of the session
   */
  title: string;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Expert {
  __typename: "Expert";
  id: number;
  /**
   * The ID of the user that is instructor
   */
  userId: number;
  /**
   * A short description on the expert's background
   */
  description: string | null;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  Expert: InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors_Expert;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course_Enrollments {
  __typename: "Enrollment";
  id: number;
  /**
   * The user's current enrollment status to this course
   */
  status: EnrollmentStatus_enum;
}

export interface InsertEnrollment_insert_Enrollment_returning_Course {
  __typename: "Course";
  id: number;
  /**
   * The number of ECTS of the course (only editable by an admin user))
   */
  ects: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The day of the week the course takes place.
   */
  weekDay: string | null;
  /**
   * A text providing info about the costs of a participation.
   */
  cost: string;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string;
  /**
   * The maximum number of sessions a participant can miss while still receiving a certificate
   */
  maxMissedSessions: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Id of the program to which the course belongs.
   */
  programId: number | null;
  /**
   * Heading of the the first course description field
   */
  headingDescriptionField1: string;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * Heading of the the second course description field
   */
  headingDescriptionField2: string | null;
  /**
   * Content of the second course description field
   */
  contentDescriptionField2: string | null;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * An array relationship
   */
  Sessions: InsertEnrollment_insert_Enrollment_returning_Course_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: InsertEnrollment_insert_Enrollment_returning_Course_CourseInstructors[];
  /**
   * An array relationship
   */
  Enrollments: InsertEnrollment_insert_Enrollment_returning_Course_Enrollments[];
}

export interface InsertEnrollment_insert_Enrollment_returning {
  __typename: "Enrollment";
  id: number;
  /**
   * The user's current enrollment status to this course
   */
  status: EnrollmentStatus_enum;
  /**
   * An object relationship
   */
  Course: InsertEnrollment_insert_Enrollment_returning_Course;
}

export interface InsertEnrollment_insert_Enrollment {
  __typename: "Enrollment_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
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
  userId: number;
  courseId: number;
  motivationLetter: string;
}
