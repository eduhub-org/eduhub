/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ScientistOfferRelation_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: InsertScientistOfferRelations
// ====================================================

export interface InsertScientistOfferRelations_insert_ScientistOfferRelation_returning {
  __typename: "ScientistOfferRelation";
  offerId: number;
  scientistId: number;
}

export interface InsertScientistOfferRelations_insert_ScientistOfferRelation {
  __typename: "ScientistOfferRelation_mutation_response";
  /**
   * data from the rows affected by the mutation
   */
  returning: InsertScientistOfferRelations_insert_ScientistOfferRelation_returning[];
}

export interface InsertScientistOfferRelations {
  /**
   * insert data into the table: "ScientistOfferRelation"
   */
  insert_ScientistOfferRelation: InsertScientistOfferRelations_insert_ScientistOfferRelation | null;
}

export interface InsertScientistOfferRelationsVariables {
  objects: ScientistOfferRelation_insert_input[];
}
