/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: CountryList
// ====================================================

export interface CountryList_Country {
  __typename: "Country";
  code: string;
  name_en: string;
  name_de: string;
}

export interface CountryList {
  /**
   * fetch data from the table: "Country"
   */
  Country: CountryList_Country[];
}
