/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Weekday_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CourseTileListAnonymous
// ====================================================

export interface CourseTileListAnonymous_Course_CourseGroups_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
  order: number;
}

export interface CourseTileListAnonymous_Course_CourseGroups {
  __typename: "CourseGroup";
  id: number;
  /**
   * An object relationship
   */
  CourseGroupOption: CourseTileListAnonymous_Course_CourseGroups_CourseGroupOption;
}

export interface CourseTileListAnonymous_Course {
  __typename: "Course";
  id: number;
  /**
   * The day of the week the course takes place.
   */
  weekDay: Weekday_enum;
  /**
   * Decides whether the course is published for all users or not.
   */
  published: boolean;
  /**
   * The cover image for the course
   */
  coverImage: string | null;
  /**
   * The language the course is given in.
   */
  language: string | null;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
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
  CourseGroups: CourseTileListAnonymous_Course_CourseGroups[];
}

export interface CourseTileListAnonymous {
  /**
   * fetch data from the table: "Course"
   */
  Course: CourseTileListAnonymous_Course[];
}
