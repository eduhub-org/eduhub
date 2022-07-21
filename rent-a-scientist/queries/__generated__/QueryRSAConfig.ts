/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: QueryRSAConfig
// ====================================================

export interface QueryRSAConfig_RentAScientistConfig_by_pk_Program {
  __typename: "Program";
  /**
   * The first day a course lecture can possibly be in this program.
   */
  lectureStart: any | null;
  /**
   * The last day a course lecture can possibly be in this program.
   */
  lectureEnd: any | null;
}

export interface QueryRSAConfig_RentAScientistConfig_by_pk {
  __typename: "RentAScientistConfig";
  program_id: number;
  /**
   * An object relationship
   */
  Program: QueryRSAConfig_RentAScientistConfig_by_pk_Program;
}

export interface QueryRSAConfig {
  /**
   * fetch data from the table: "RentAScientistConfig" using primary key columns
   */
  RentAScientistConfig_by_pk: QueryRSAConfig_RentAScientistConfig_by_pk | null;
}
