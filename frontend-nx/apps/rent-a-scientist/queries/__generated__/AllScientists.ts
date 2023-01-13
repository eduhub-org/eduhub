/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AllScientists
// ====================================================

export interface AllScientists_Scientist {
  __typename: "Scientist";
  id: number;
  forename: string;
  surname: string;
  title: string;
  image: string | null;
}

export interface AllScientists {
  /**
   * fetch data from the table: "Scientist"
   */
  Scientist: AllScientists_Scientist[];
}
