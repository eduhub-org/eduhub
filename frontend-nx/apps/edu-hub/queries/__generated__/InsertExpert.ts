/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertExpert
// ====================================================

export interface InsertExpert_insert_Expert_returning {
  __typename: "Expert";
  id: number;
}

export interface InsertExpert_insert_Expert {
  __typename: "Expert_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertExpert_insert_Expert_returning[];
}

export interface InsertExpert {
  /**
   * insert data into the table: "Expert"
   */
  insert_Expert: InsertExpert_insert_Expert | null;
}

export interface InsertExpertVariables {
  userId: any;
}
