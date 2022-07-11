/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseLocationLink
// ====================================================

export interface UpdateCourseLocationLink_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
}

export interface UpdateCourseLocationLink {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseLocationLink_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseLocationLinkVariables {
  locationId: number;
  link: string;
}
