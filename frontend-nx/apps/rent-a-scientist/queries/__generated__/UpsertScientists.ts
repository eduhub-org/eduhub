/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { Scientist_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpsertScientists
// ====================================================

export interface UpsertScientists_insert_Scientist_returning {
  __typename: "Scientist";
  id: number;
}

export interface UpsertScientists_insert_Scientist {
  __typename: "Scientist_mutation_response";
  /**
   * data from the rows affected by the mutation
   */
  returning: UpsertScientists_insert_Scientist_returning[];
}

export interface UpsertScientists {
  /**
   * insert data into the table: "Scientist"
   */
  insert_Scientist: UpsertScientists_insert_Scientist | null;
}

export interface UpsertScientistsVariables {
  objects: Scientist_insert_input[];
}
