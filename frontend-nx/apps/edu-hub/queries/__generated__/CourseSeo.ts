/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { CourseRegistrationType_enum, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseSeo
// ====================================================

export interface CourseSeo_Course_by_pk_Program {
  __typename: "Program";
  id: number;
  type: string;
  /**
   * The title of the program
   */
  title: string;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface CourseSeo_Course_by_pk_CourseLocations {
  __typename: "CourseLocation";
  id: number;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
  /**
   * Will be used as default for any new session address.
   */
  defaultSessionAddress: string | null;
}

export interface CourseSeo_Course_by_pk_Sessions_SessionSpeakers_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface CourseSeo_Course_by_pk_Sessions_SessionSpeakers {
  __typename: "SessionSpeaker";
  id: number;
  /**
   * An object relationship
   */
  User: CourseSeo_Course_by_pk_Sessions_SessionSpeakers_User;
}

export interface CourseSeo_Course_by_pk_Sessions {
  __typename: "Session";
  id: number;
  /**
   * The title of the session
   */
  title: string;
  /**
   * A description of the session
   */
  description: string;
  /**
   * The day and time of the start of the session
   */
  startDateTime: any;
  /**
   * The day and time of the end of the session
   */
  endDateTime: any;
  /**
   * An array relationship
   */
  SessionSpeakers: CourseSeo_Course_by_pk_Sessions_SessionSpeakers[];
}

export interface CourseSeo_Course_by_pk_CourseInstructors_User {
  __typename: "User";
  id: any;
  /**
   * The user's first name
   */
  firstName: string;
  /**
   * The user's last name
   */
  lastName: string;
}

export interface CourseSeo_Course_by_pk_CourseInstructors {
  __typename: "CourseInstructor";
  id: number;
  /**
   * An object relationship
   */
  User: CourseSeo_Course_by_pk_CourseInstructors_User;
}

export interface CourseSeo_Course_by_pk_DegreeCourses_Course_Program {
  __typename: "Program";
  id: number;
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
}

export interface CourseSeo_Course_by_pk_DegreeCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * An object relationship
   */
  Program: CourseSeo_Course_by_pk_DegreeCourses_Course_Program;
}

export interface CourseSeo_Course_by_pk_DegreeCourses {
  __typename: "CourseDegree";
  id: number;
  /**
   * An object relationship
   */
  Course: CourseSeo_Course_by_pk_DegreeCourses_Course;
}

export interface CourseSeo_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
  /**
   * Shown below the title on the course page
   */
  tagline: string;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string | null;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  registrationType: CourseRegistrationType_enum | null;
  /**
   * Last day before applications are closed. (Set to the program's default value when the course is created.)
   */
  applicationEnd: any;
  /**
   * Base price in cents (e.g., 5000 = €50.00)
   */
  basePrice: number | null;
  /**
   * Currency code (EUR, USD, etc.)
   */
  currency: string | null;
  /**
   * The number of maximum participants in the course.
   */
  maxParticipants: number | null;
  /**
   * Minimum number of ECTS a participant must have collected from this degree's member courses (CourseDegree.degreeCourseId = this course) before a degree certificate can be generated. Only member enrollments carrying an achievementCertificateURL count, matching the DegreeParticipationStats view. Only meaningful for a course whose Program.type = 'DEGREES'. NULL = requirement not checked.
   */
  requiredEcts: any | null;
  /**
   * Content of the first course description field
   */
  contentDescriptionField1: string | null;
  /**
   * An object relationship
   */
  Program: CourseSeo_Course_by_pk_Program;
  /**
   * An array relationship
   */
  CourseLocations: CourseSeo_Course_by_pk_CourseLocations[];
  /**
   * An array relationship
   */
  Sessions: CourseSeo_Course_by_pk_Sessions[];
  /**
   * An array relationship
   */
  CourseInstructors: CourseSeo_Course_by_pk_CourseInstructors[];
  /**
   * An array relationship
   */
  DegreeCourses: CourseSeo_Course_by_pk_DegreeCourses[];
}

export interface CourseSeo {
  /**
   * fetch data from the table: "Course" using primary key columns
   */
  Course_by_pk: CourseSeo_Course_by_pk | null;
}

export interface CourseSeoVariables {
  id: number;
}
