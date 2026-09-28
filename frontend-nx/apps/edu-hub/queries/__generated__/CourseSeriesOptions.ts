/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseSeriesOptions
// ====================================================

export interface CourseSeriesOptions_CourseSeries {
  __typename: "CourseSeries";
  id: number;
  title: string;
}

export interface CourseSeriesOptions {
  /**
   * fetch data from the table: "CourseSeries"
   */
  CourseSeries: CourseSeriesOptions_CourseSeries[];
}

export interface CourseSeriesOptionsVariables {
  organizationId: number;
}
