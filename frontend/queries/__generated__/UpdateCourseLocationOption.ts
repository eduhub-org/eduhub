/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseLocationOption
// ====================================================

export interface UpdateCourseLocationOption_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface UpdateCourseLocationOption {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseLocationOption_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseLocationOptionVariables {
  locationId: number;
  option: string;
}
