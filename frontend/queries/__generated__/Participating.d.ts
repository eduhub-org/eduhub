/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Participating
// ====================================================

export interface Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors_Instructor_Person {
  __typename: "Person";
  Firstname: string;
  Image: string | null;
  Lastname: string;
  Id: number;
}

export interface Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors_Instructor {
  __typename: "Instructor";
  /**
   * An object relationship
   */
  Person: Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors_Instructor_Person;
  Description: string | null;
  Qualification: string | null;
  Id: number;
}

export interface Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors {
  __typename: "CourseInstructor";
  /**
   * An object relationship
   */
  Instructor: Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors_Instructor;
  Id: number;
}

export interface Participating_Person_by_pk_Participants_Enrollments_Course_Sessions {
  __typename: "Session";
  Id: number;
  Description: string;
  Finish: any;
  Start: any;
  Title: string;
}

export interface Participating_Person_by_pk_Participants_Enrollments_Course {
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
  CourseInstructors: Participating_Person_by_pk_Participants_Enrollments_Course_CourseInstructors[];
  Ects: string;
  Status: number;
  MaxMissedDates: number;
  MaxProjectParticipants: number;
  /**
   * An array relationship
   */
  Sessions: Participating_Person_by_pk_Participants_Enrollments_Course_Sessions[];
}

export interface Participating_Person_by_pk_Participants_Enrollments {
  __typename: "Enrollment";
  /**
   * An object relationship
   */
  Course: Participating_Person_by_pk_Participants_Enrollments_Course;
}

export interface Participating_Person_by_pk_Participants {
  __typename: "Participant";
  /**
   * An array relationship
   */
  Enrollments: Participating_Person_by_pk_Participants_Enrollments[];
}

export interface Participating_Person_by_pk {
  __typename: "Person";
  /**
   * An array relationship
   */
  Participants: Participating_Person_by_pk_Participants[];
}

export interface Participating {
  /**
   * fetch data from the table: "Person" using primary key columns
   */
  Person_by_pk: Participating_Person_by_pk | null;
}

export interface ParticipatingVariables {
  id: number;
}
