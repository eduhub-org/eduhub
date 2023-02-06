/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseSessionDefaultAddres
// ====================================================

export interface UpdateCourseSessionDefaultAddres_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface UpdateCourseSessionDefaultAddres {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseSessionDefaultAddres_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseSessionDefaultAddresVariables {
  locationId: number;
  sessionDefaultAddress: string;
}
