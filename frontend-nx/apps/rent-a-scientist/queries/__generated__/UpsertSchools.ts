/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { School_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpsertSchools
// ====================================================

export interface UpsertSchools_insert_School_returning {
  __typename: "School";
  dstnr: string;
}

export interface UpsertSchools_insert_School {
  __typename: "School_mutation_response";
  /**
   * data from the rows affected by the mutation
   */
  returning: UpsertSchools_insert_School_returning[];
}

export interface UpsertSchools {
  /**
   * insert data into the table: "School"
   */
  insert_School: UpsertSchools_insert_School | null;
}

export interface UpsertSchoolsVariables {
  objects: School_insert_input[];
}
