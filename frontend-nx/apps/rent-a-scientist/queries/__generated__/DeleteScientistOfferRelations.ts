/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteScientistOfferRelations
// ====================================================

export interface DeleteScientistOfferRelations_delete_ScientistOfferRelation {
  __typename: "ScientistOfferRelation_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteScientistOfferRelations {
  /**
   * delete data from the table: "ScientistOfferRelation"
   */
  delete_ScientistOfferRelation: DeleteScientistOfferRelations_delete_ScientistOfferRelation | null;
}

export interface DeleteScientistOfferRelationsVariables {
  ids: number[];
}
