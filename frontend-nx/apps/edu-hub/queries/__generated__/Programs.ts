/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Programs
// ====================================================

export interface Programs_Program {
  __typename: "Program";
  id: number;
  /**
   * The 6 letter short title for the program.
   */
  shortTitle: string | null;
  /**
   * The title of the program
   */
  title: string;
}

export interface Programs {
  /**
   * fetch data from the table: "Program"
   */
  Program: Programs_Program[];
}
