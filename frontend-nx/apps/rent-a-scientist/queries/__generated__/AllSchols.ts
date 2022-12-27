/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllSchols
// ====================================================

export interface AllSchols_School {
  __typename: "School";
  dstnr: string;
  name: string;
  schoolType: string;
  district: string;
  street: string;
  postalCode: string;
  city: string;
}

export interface AllSchols {
  /**
   * fetch data from the table: "School"
   */
  School: AllSchols_School[];
}
