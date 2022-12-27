/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: InsertSessionLocation
// ====================================================

export interface InsertSessionLocation_insert_SessionAddress_returning {
  __typename: "SessionAddress";
  id: number;
}

export interface InsertSessionLocation_insert_SessionAddress {
  __typename: "SessionAddress_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertSessionLocation_insert_SessionAddress_returning[];
}

export interface InsertSessionLocation {
  /**
   * insert data into the table: "SessionAddress"
   */
  insert_SessionAddress: InsertSessionLocation_insert_SessionAddress | null;
}

export interface InsertSessionLocationVariables {
  sessionId: number;
  link: string;
}
