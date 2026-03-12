/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertSessionAddress
// ====================================================

export interface InsertSessionAddress_insert_SessionAddress_returning {
  __typename: "SessionAddress";
  id: number;
}

export interface InsertSessionAddress_insert_SessionAddress {
  __typename: "SessionAddress_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertSessionAddress_insert_SessionAddress_returning[];
}

export interface InsertSessionAddress {
  /**
   * insert data into the table: "SessionAddress"
   */
  insert_SessionAddress: InsertSessionAddress_insert_SessionAddress | null;
}

export interface InsertSessionAddressVariables {
  sessionId: number;
  address: string;
  courseLocationId: number;
}
