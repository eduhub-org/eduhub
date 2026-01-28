/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseBasePrice
// ====================================================

export interface UpdateCourseBasePrice_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Base price in cents (e.g., 5000 = €50.00)
   */
  basePrice: number | null;
}

export interface UpdateCourseBasePrice {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseBasePrice_update_Course_by_pk | null;
}

export interface UpdateCourseBasePriceVariables {
  itemId: number;
  text: number;
}
