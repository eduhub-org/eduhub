/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

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
  location: LocationOption_enum;
  address: string;
  courseLocationId: number;
}
