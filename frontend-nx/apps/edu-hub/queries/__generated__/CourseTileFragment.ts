/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Weekday_enum, LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL fragment: CourseTileFragment
// ====================================================

export interface CourseTileFragment_Program {
  __typename: "Program";
  /**
   * Decides whether the courses of this program can be published or not. (Courses are ony published if the filed publised in the Course table is also set to true.)
   */
  published: boolean;
  /**
   * The title of the program
   */
  title: string;
}

export interface CourseTileFragment_CourseLocations {
  __typename: "CourseLocation";
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
}

export interface CourseTileFragment {
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
   * The day of the week the course takes place.
   */
  weekDay: Weekday_enum;
  /**
   * The time the course starts each week.
   */
  startTime: any | null;
  /**
   * The time the course ends each week.
   */
  endTime: any | null;
  /**
   * An object relationship
   */
  Program: CourseTileFragment_Program;
  /**
   * An array relationship
   */
  CourseLocations: CourseTileFragment_CourseLocations[];
}
