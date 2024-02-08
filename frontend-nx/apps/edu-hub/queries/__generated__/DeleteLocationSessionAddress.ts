/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import { LocationOption_enum } from "./../../__generated__/globalTypes";

// ====================================================
// GraphQL mutation operation: DeleteLocationSessionAddress
// ====================================================

export interface DeleteLocationSessionAddress_delete_SessionAddress {
  __typename: "SessionAddress_mutation_response";
  /**
   * number of rows affected by the mutation
   */
  affected_rows: number;
}

export interface DeleteLocationSessionAddress {
  /**
   * delete data from the table: "SessionAddress"
   */
  delete_SessionAddress: DeleteLocationSessionAddress_delete_SessionAddress | null;
}

export interface DeleteLocationSessionAddressVariables {
  courseId: number;
  location: LocationOption_enum;
}
