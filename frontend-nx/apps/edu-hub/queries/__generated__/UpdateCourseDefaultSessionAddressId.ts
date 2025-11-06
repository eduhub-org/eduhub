/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseDefaultSessionAddressId
// ====================================================

export interface UpdateCourseDefaultSessionAddressId_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
  /**
   * References a LocationAddress that serves as the default for sessions in this course location. Replaces the legacy text-based defaultSessionAddress field.
   */
  defaultSessionAddressId: number | null;
}

export interface UpdateCourseDefaultSessionAddressId {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseDefaultSessionAddressId_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseDefaultSessionAddressIdVariables {
  itemId: number;
  value?: number | null;
}
