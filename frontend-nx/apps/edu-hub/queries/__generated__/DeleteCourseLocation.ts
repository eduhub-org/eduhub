/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteCourseLocation
// ====================================================

export interface DeleteCourseLocation_delete_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface DeleteCourseLocation {
  /**
   * delete single row from the table: "CourseLocation"
   */
  delete_CourseLocation_by_pk: DeleteCourseLocation_delete_CourseLocation_by_pk | null;
}

export interface DeleteCourseLocationVariables {
  locationId: number;
}
