/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseSessionDefaultAddress
// ====================================================

export interface UpdateCourseSessionDefaultAddress_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface UpdateCourseSessionDefaultAddress {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseSessionDefaultAddress_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseSessionDefaultAddressVariables {
  locationId: number;
  sessionDefaultAddress: string;
}
