/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseGroupOptions
// ====================================================

export interface CourseGroupOptions_CourseGroupOption {
  __typename: "CourseGroupOption";
  id: number;
  order: number;
  title: string;
}

export interface CourseGroupOptions {
  /**
   * fetch data from the table: "CourseGroupOption"
   */
  CourseGroupOption: CourseGroupOptions_CourseGroupOption[];
}
