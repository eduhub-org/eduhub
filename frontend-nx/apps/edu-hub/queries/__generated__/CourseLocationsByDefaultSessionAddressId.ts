/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CourseLocationsByDefaultSessionAddressId
// ====================================================

export interface CourseLocationsByDefaultSessionAddressId_CourseLocation {
  __typename: "CourseLocation";
  id: number;
  /**
   * References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.
   */
  defaultSessionAddressId: number | null;
}

export interface CourseLocationsByDefaultSessionAddressId {
  /**
   * fetch data from the table: "CourseLocation"
   */
  CourseLocation: CourseLocationsByDefaultSessionAddressId_CourseLocation[];
}

export interface CourseLocationsByDefaultSessionAddressIdVariables {
  locationAddressIds: number[];
}
