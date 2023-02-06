/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseDefaultSessionAddress
// ====================================================

export interface UpdateCourseDefaultSessionAddress_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface UpdateCourseDefaultSessionAddress {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseDefaultSessionAddress_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseDefaultSessionAddressVariables {
  locationId: number;
  defaultSessionAddress: string;
}
