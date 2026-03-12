/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpdateCourseLocation
// ====================================================

export interface UpdateCourseLocation_update_CourseLocation_by_pk {
  __typename: "CourseLocation";
  id: number;
  /**
   * Either 'ONLINE' or one of the possible given offline locations
   */
  locationOption: LocationOption_enum | null;
}

export interface UpdateCourseLocation {
  /**
   * update single row of the table: "CourseLocation"
   */
  update_CourseLocation_by_pk: UpdateCourseLocation_update_CourseLocation_by_pk | null;
}

export interface UpdateCourseLocationVariables {
  locationId: number;
  value: LocationOption_enum;
}
