/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: DeleteSessionAddressesByCourseAndLocation
// ====================================================

export interface DeleteSessionAddressesByCourseAndLocation_delete_SessionAddress {
  __typename: "SessionAddress_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteSessionAddressesByCourseAndLocation {
  /**
   * delete data from the table: "SessionAddress"
   */
  delete_SessionAddress: DeleteSessionAddressesByCourseAndLocation_delete_SessionAddress | null;
}

export interface DeleteSessionAddressesByCourseAndLocationVariables {
  courseId: number;
  courseLocationId: number;
}
