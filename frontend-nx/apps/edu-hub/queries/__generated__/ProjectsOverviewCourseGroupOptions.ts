/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Course_bool_exp } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL query operation: ProjectsOverviewCourseGroupOptions
// ====================================================

export interface ProjectsOverviewCourseGroupOptions_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  title: string;
}

export interface ProjectsOverviewCourseGroupOptions {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: ProjectsOverviewCourseGroupOptions_CourseGroupOption[];
}

export interface ProjectsOverviewCourseGroupOptionsVariables {
  courseWhere: Course_bool_exp;
}
