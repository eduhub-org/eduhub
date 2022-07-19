/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: QueryActiveProgramId
// ====================================================

export interface QueryActiveProgramId_RentAScientistConfig_by_pk {
  __typename: "RentAScientistConfig";
  program_id: number;
}

export interface QueryActiveProgramId {
  /**
   * fetch data from the table: "RentAScientistConfig" using primary key columns
   */
  RentAScientistConfig_by_pk: QueryActiveProgramId_RentAScientistConfig_by_pk | null;
}
