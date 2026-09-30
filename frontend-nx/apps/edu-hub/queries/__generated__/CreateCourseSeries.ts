/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: CreateCourseSeries
// ====================================================

export interface CreateCourseSeries_createOption {
  __typename: "CourseSeries";
  value: number;
}

export interface CreateCourseSeries {
  /**
   * insert a single row into the table: "CourseSeries"
   */
  createOption: CreateCourseSeries_createOption | null;
}

export interface CreateCourseSeriesVariables {
  value: string;
  organizationId: number;
}
