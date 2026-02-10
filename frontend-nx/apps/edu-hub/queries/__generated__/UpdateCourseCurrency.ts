/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: UpdateCourseCurrency
// ====================================================

export interface UpdateCourseCurrency_update_Course_by_pk {
  __typename: "Course";
  id: number;
  /**
   * Currency code (EUR, USD, etc.)
   */
  currency: string | null;
}

export interface UpdateCourseCurrency {
  /**
   * update single row of the table: "Course"
   */
  update_Course_by_pk: UpdateCourseCurrency_update_Course_by_pk | null;
}

export interface UpdateCourseCurrencyVariables {
  itemId: number;
  value: string;
}
