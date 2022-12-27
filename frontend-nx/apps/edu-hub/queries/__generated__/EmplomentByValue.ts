/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: EmplomentByValue
// ====================================================

export interface EmplomentByValue_Employment {
  __typename: "Employment";
  value: string;
  comment: string;
}

export interface EmplomentByValue {
  /**
   * fetch data from the table: "Employment"
   */
  Employment: EmplomentByValue_Employment[];
}
