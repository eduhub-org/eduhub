/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { ScientistOffer_insert_input } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: UpsertScientistOffers
// ====================================================

export interface UpsertScientistOffers_insert_ScientistOffer_returning {
  __typename: "ScientistOffer";
  id: number;
}

export interface UpsertScientistOffers_insert_ScientistOffer {
  __typename: "ScientistOffer_mutation_response";
  /**
   * data from the rows affected by the mutation
   */
  returning: UpsertScientistOffers_insert_ScientistOffer_returning[];
}

export interface UpsertScientistOffers {
  /**
   * insert data into the table: "ScientistOffer"
   */
  insert_ScientistOffer: UpsertScientistOffers_insert_ScientistOffer | null;
}

export interface UpsertScientistOffersVariables {
  objects: ScientistOffer_insert_input[];
}
