/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertProgram
// ====================================================

export interface InsertProgram_insert_Program_returning {
  __typename: "Program";
  id: number;
}

export interface InsertProgram_insert_Program {
  __typename: "Program_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertProgram_insert_Program_returning[];
}

export interface InsertProgram {
  /**
   * insert data into the table: "Program"
   */
  insert_Program: InsertProgram_insert_Program | null;
}

export interface InsertProgramVariables {
  title: string;
  today: any;
}
