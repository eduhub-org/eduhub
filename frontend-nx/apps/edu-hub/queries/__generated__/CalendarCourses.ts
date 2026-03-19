/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: CalendarCourses
// ====================================================

export interface CalendarCourses_Course {
  __typename: "Course";
  id: number;
  /**
   * The title of the course (only editable by an admin user)
   */
  title: string;
}

export interface CalendarCourses {
  /**
   * fetch data from the table: "Course"
   */
  Course: CalendarCourses_Course[];
}

export interface CalendarCoursesVariables {
  where?: Course_bool_exp | null;
  limit?: number | null;
}
