/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SchoolClassRequest_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertClassRequests
// ====================================================

export interface InsertClassRequests_insert_SchoolClassRequest_returning {
  __typename: "SchoolClassRequest";
  id: number;
}

export interface InsertClassRequests_insert_SchoolClassRequest {
  __typename: "SchoolClassRequest_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertClassRequests_insert_SchoolClassRequest_returning[];
}

export interface InsertClassRequests {
  /**
   * insert data into the table: "SchoolClassRequest"
   */
  insert_SchoolClassRequest: InsertClassRequests_insert_SchoolClassRequest | null;
}

export interface InsertClassRequestsVariables {
  inputs: SchoolClassRequest_insert_input[];
}
