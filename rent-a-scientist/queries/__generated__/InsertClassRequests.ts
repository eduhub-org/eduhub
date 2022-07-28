/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { SchoolClass_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertClassRequests
// ====================================================

export interface InsertClassRequests_insert_SchoolClass_returning {
  __typename: "SchoolClass";
  id: number;
}

export interface InsertClassRequests_insert_SchoolClass {
  __typename: "SchoolClass_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertClassRequests_insert_SchoolClass_returning[];
}

export interface InsertClassRequests {
  /**
   * insert data into the table: "SchoolClass"
   */
  insert_SchoolClass: InsertClassRequests_insert_SchoolClass | null;
}

export interface InsertClassRequestsVariables {
  inputs: SchoolClass_insert_input[];
}
